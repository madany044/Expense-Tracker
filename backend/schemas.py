# backend/schemas.py
from datetime import date
from decimal import Decimal, InvalidOperation

REQUIRED = ("title", "amount", "date", "category")

def parse_expense_payload(body: dict):
    errors = []
    for key in REQUIRED:
        if key not in body:
            errors.append(f"Missing field: {key}")
    if errors:
        return None, errors

    title = str(body.get("title", "")).strip()
    category = str(body.get("category", "")).strip()
    if not title:
        errors.append("title cannot be empty")
    if not category:
        errors.append("category cannot be empty")

    try:
        amount = Decimal(str(body.get("amount")))
        if amount <= 0:
            errors.append("amount must be > 0")
    except (InvalidOperation, TypeError):
        errors.append("amount must be a valid number")
        amount = None

    try:
        parts = str(body.get("date")).split("-")
        d = date(int(parts[0]), int(parts[1]), int(parts[2]))
    except Exception:
        errors.append("date must be in YYYY-MM-DD format")
        d = None

    if errors:
        return None, errors

    return {
        "title": title,
        "amount": amount,
        "date": d,
        "category": category,
    }, None
