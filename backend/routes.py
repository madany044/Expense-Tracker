from flask import Blueprint, request, jsonify
from db import SessionLocal
from models import Expense
from util import expense_to_dict
from schemas import parse_expense_payload
from sqlalchemy import extract, func, or_
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

logger = logging.getLogger(__name__)

api = Blueprint("api", __name__)



@api.get("/expenses")
@jwt_required(optional=True)   # allow optional for demo (change to required() later)
def list_expenses():
    session = SessionLocal()
    try:
        uid = get_jwt_identity()  # None if not logged in
        # parse pagination & filters (keep your defensive parsing)
        q_param = request.args.get("q", type=str)
        date_from = request.args.get("from", type=str)
        date_to = request.args.get("to", type=str)
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 10))

        q = session.query(Expense)

        if uid:
            try:
                uid_int = int(uid)
            except:
                uid_int = uid
            q = q.filter(Expense.user_id == uid_int)
        else:
            # not logged in -> return nothing OR global (admin) items
            # Option A (hide all): q = q.filter(False)
            # Option B (show admin/global): q = q.filter(Expense.user_id == None)
            # We'll show admin-only by showing user_id IS NULL? If you assigned admin, use admin id
            q = q.filter(Expense.user_id == None)

        if q_param:
            q_lower = f"%{q_param.lower()}%"
            q = q.filter(
                or_(
                    func.lower(Expense.title).like(q_lower),
                    func.lower(Expense.category).like(q_lower),
                )
            )

        if date_from:
            q = q.filter(Expense.date >= date_from)
        if date_to:
            q = q.filter(Expense.date <= date_to)

        q = q.order_by(Expense.date.desc(), Expense.id.desc())
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        data = [expense_to_dict(e) for e in items]
        return jsonify(data), 200
    except Exception as e:
        import logging; logging.exception("list_expenses failed")
        return jsonify({"error": "internal_server_error", "details": str(e)}), 500
    finally:
        session.close()


    return jsonify(data), 200


# Defensive and user-aware create_expense
@api.post("/expenses")
@jwt_required(optional=True)
def create_expense():
    session = SessionLocal()
    try:
        body = request.get_json(silent=True)
        if body is None:
            return jsonify({"errors": ["Invalid or missing JSON body"]}), 400
        parsed, errors = parse_expense_payload(body)
        if errors:
            return jsonify({"errors": errors}), 400

        user_id = get_jwt_identity()
        # user_id will be string (we cast to int)
        try:
            user_id = int(user_id)
        except Exception:
            # if we stored as string, but DB expects int, convert
            pass

        e = Expense(**parsed)
        e.user_id = user_id
        session.add(e)
        session.commit()
        session.refresh(e)
        data = expense_to_dict(e)
        return jsonify(data), 201
    except Exception as exc:
        session.rollback()
        import logging; logging.exception("create_expense failed")
        return jsonify({"error": "internal_server_error", "details": str(exc)}), 500
    finally:
        session.close()
        

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
@jwt_required(optional=False)  # require login
def summary_month():
    session = SessionLocal()
    try:
        uid = get_jwt_identity()
        if uid is None:
            return jsonify({"error": "unauthorized"}), 401
        try:
            uid_int = int(uid)
        except Exception:
            uid_int = uid

        year = request.args.get("year", type=int)
        month = request.args.get("month", type=int)
        if not year or not month:
            return jsonify({"error": "year and month required"}), 400

        # calculate first and last day strings
        from datetime import date, timedelta
        start = date(year, month, 1)
        # compute last day of month
        if month == 12:
            end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date(year, month + 1, 1) - timedelta(days=1)

        total_q = session.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == uid_int,
            Expense.date >= start,
            Expense.date <= end
        )
        total = total_q.scalar() or 0
        return jsonify({"year": year, "month": month, "total": float(total)}), 200
    except Exception as e:
        import logging; logging.exception("summary_month failed")
        return jsonify({"error": "internal_server_error", "details": str(e)}), 500
    finally:
        session.close()


@api.get("/summary/by_category")
@jwt_required(optional=False)   # require login for summaries
def summary_by_category():
    session = SessionLocal()
    try:
        uid = get_jwt_identity()
        if uid is None:
            return jsonify({"error": "unauthorized"}), 401
        try:
            uid_int = int(uid)
        except Exception:
            uid_int = uid

        date_from = request.args.get("from", type=str)
        date_to = request.args.get("to", type=str)

        q = session.query(Expense.category, func.coalesce(func.sum(Expense.amount), 0).label("total"))
        q = q.filter(Expense.user_id == uid_int)

        if date_from:
            q = q.filter(Expense.date >= date_from)
        if date_to:
            q = q.filter(Expense.date <= date_to)

        q = q.group_by(Expense.category)
        rows = q.all()
        result = [{"category": r[0], "total": float(r[1])} for r in rows]
        return jsonify(result), 200
    except Exception as e:
        import logging; logging.exception("summary_by_category failed")
        return jsonify({"error": "internal_server_error", "details": str(e)}), 500
    finally:
        session.close()



    # Return strings for currency safety
    return [{"category": r[0], "total": str(r[1])} for r in rows], 200
