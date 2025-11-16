from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, func, Index, ForeignKey
from db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(120), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True)
    title = Column(String(120), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    date = Column(Date, nullable=False)
    category = Column(String(50), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

Index("ix_expenses_date", Expense.date)
Index("ix_expenses_category", Expense.category)
Index("ix_expenses_user_id", Expense.user_id)
