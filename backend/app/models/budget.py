from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.transactions import Category
    from app.models.users import User


class Budget(Base):
    __tablename__ = "budgets"
    # One budget per category per month.
    __table_args__ = (
        UniqueConstraint(
            "user_id", "category_id", "month", "year", name="uq_budgets_user_category_month"
        ),
    )

    budget_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # A budget for a deleted category means nothing, so it goes too.
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.category_id", ondelete="CASCADE")
    )

    month: Mapped[int] = mapped_column()
    year: Mapped[int] = mapped_column()
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    # relationships
    user: Mapped["User"] = relationship(back_populates="budgets")
    category: Mapped["Category"] = relationship()


class SavingSuggestion(Base):
    __tablename__ = "saving_suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship()
