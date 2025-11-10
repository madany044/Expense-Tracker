# backend/util.py
from decimal import Decimal

def expense_to_dict(e):
    return {
        "id": e.id,
        "title": e.title,
        "amount": str(e.amount) if isinstance(e.amount, Decimal) else float(e.amount),
        "date": e.date.isoformat(),
        "category": e.category,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "updated_at": e.updated_at.isoformat() if e.updated_at else None,
    }
