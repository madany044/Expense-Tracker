# backend/routes.py
from flask import Blueprint, request, jsonify
from db import SessionLocal
from models import Expense
from util import expense_to_dict
from schemas import parse_expense_payload
from sqlalchemy import extract, func, or_


api = Blueprint("api", __name__)

@api.get("/expenses")
def list_expenses():
    """
    List expenses with optional filters:
      - q: search in title/category (case-insensitive)
      - from, to: date range (YYYY-MM-DD)
      - page, page_size: pagination
    """
    s = SessionLocal()
    qset = s.query(Expense)

    q = request.args.get("q", type=str)
    if q:
        q_lower = f"%{q.lower()}%"
        qset = qset.filter(
            or_(func.lower(Expense.title).like(q_lower),
                func.lower(Expense.category).like(q_lower))
        )

    date_from = request.args.get("from")
    date_to = request.args.get("to")
    if date_from:
        qset = qset.filter(Expense.date >= date_from)
    if date_to:
        qset = qset.filter(Expense.date <= date_to)

    # default sort: newest first
    qset = qset.order_by(Expense.date.desc(), Expense.id.desc())

    page = request.args.get("page", default=1, type=int)
    page_size = request.args.get("page_size", default=20, type=int)
    page_size = min(max(page_size, 1), 100)

    items = qset.offset((page - 1) * page_size).limit(page_size).all()
    data = [expense_to_dict(e) for e in items]
    s.close()
    return jsonify(data), 200

@api.post("/expenses")
def create_expense():
    """Create an expense after validating input."""
    s = SessionLocal()
    body = request.get_json() or {}
    parsed, errors = parse_expense_payload(body)
    if errors:
        s.close()
        return jsonify({"errors": errors}), 400

    e = Expense(**parsed)
    s.add(e)
    s.commit()
    s.refresh(e)
    data = expense_to_dict(e)
    s.close()
    return jsonify(data), 201


@api.put("/expenses/<int:expense_id>")
def update_expense(expense_id: int):
    """Update an expense (partial allowed, with validation)."""
    s = SessionLocal()
    e = s.get(Expense, expense_id)
    if not e:
        s.close()
        return jsonify({"error": "not found"}), 404

    body = request.get_json() or {}

    # Build a merged payload so we can reuse the same validator
    merged = {
        "title": body.get("title", e.title),
        "amount": body.get("amount", str(e.amount)),      # keep as string for validator
        "date": body.get("date", e.date.isoformat()),     # ISO date string
        "category": body.get("category", e.category),
    }

    parsed, errors = parse_expense_payload(merged)
    if errors:
        s.close()
        return jsonify({"errors": errors}), 400

    # Apply updates
    for k, v in parsed.items():
        setattr(e, k, v)

    s.commit()
    s.refresh(e)
    data = expense_to_dict(e)
    s.close()
    return jsonify(data), 200


@api.delete("/expenses/<int:expense_id>")
def delete_expense(expense_id: int):
    """Delete an expense by id."""
    s = SessionLocal()
    e = s.get(Expense, expense_id)
    if not e:
        s.close()
        return jsonify({"error": "not found"}), 404

    s.delete(e)
    s.commit()
    s.close()
    return "", 204


@api.get("/summary/month")
def summary_month():
    """
    Total spent in a given month.
    Defaults to the database's current month if year/month are not provided.
    Query: /summary/month?year=2025&month=11
    """
    s = SessionLocal()
    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)

    q = s.query(func.coalesce(func.sum(Expense.amount), 0))
    if year and month:
        q = q.filter(
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month
        )
    else:
        # Use DB clock for consistency
        q = q.filter(
            extract("year", Expense.date) == extract("year", func.current_date()),
            extract("month", Expense.date) == extract("month", func.current_date())
        )

    total = q.scalar()  # Decimal or 0
    s.close()
    return {"total": str(total)}, 200


@api.get("/summary/by_category")
def summary_by_category():
    """
    Sum of expenses grouped by category.
    Optional range filters: ?from=YYYY-MM-DD&to=YYYY-MM-DD
    """
    s = SessionLocal()
    date_from = request.args.get("from")
    date_to = request.args.get("to")

    q = s.query(
        Expense.category,
        func.coalesce(func.sum(Expense.amount), 0).label("total")
    )
    if date_from:
        q = q.filter(Expense.date >= date_from)
    if date_to:
        q = q.filter(Expense.date <= date_to)

    q = q.group_by(Expense.category).order_by(func.sum(Expense.amount).desc())
    rows = q.all()
    s.close()

    # Return strings for currency safety
    return [{"category": r[0], "total": str(r[1])} for r in rows], 200