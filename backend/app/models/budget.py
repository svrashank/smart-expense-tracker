from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, DateTime, Float, ForeignKey, Enum as SQLAlchemyEnum
from datetime import datetime
from typing import List, Optional
from enum import Enum
from app.models.base import Base



class Budget(Base):
    __tablename__ = "budgets"

    budget_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.category_id"))

    month: Mapped[int] = mapped_column()
    year: Mapped[int] = mapped_column()
    amount: Mapped[float] = mapped_column()

    # relationships
    user: Mapped["User"] = relationship(back_populates = "budget")
    category: Mapped["Category"] = relationship()

class SavingSuggestion(Base):
    __tablename__ = "saving_suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    message: Mapped[str] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    user: Mapped["User"] = relationship()

