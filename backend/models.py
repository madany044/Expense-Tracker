from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, func, Index
from db import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True)
    title = Column(String(120), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)  # money-safe fixed precision
    date = Column(Date, nullable=False)
    category = Column(String(50), nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

# Helpful indexes for typical queries
Index("ix_expenses_date", Expense.date)
Index("ix_expenses_category", Expense.category)
