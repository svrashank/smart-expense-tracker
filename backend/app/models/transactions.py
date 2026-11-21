from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.users import User


class ModeOfPurchase(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"


class NecessityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # No ondelete here on purpose. Postgres then refuses to delete a category that
    # still has transactions, so money history is never lost. The service will have
    # to ask the user to move those transactions first.
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.category_id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # Merchant or payer, e.g. "Swiggy".
    description: Mapped[str] = mapped_column(String(100), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    mode_of_purchase: Mapped[ModeOfPurchase | None] = mapped_column(
        SQLAlchemyEnum(ModeOfPurchase, name="mode_of_purchase"), nullable=True
    )

    # selectin on purpose: transaction lists always show the category name.
    category: Mapped["Category"] = relationship(back_populates="transactions", lazy="selectin")
    user: Mapped["User"] = relationship(back_populates="transactions")


class Category(Base):
    __tablename__ = "categories"
    # One user can't have two categories with the same name (D-1: categories are per-user).
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_categories_user_id_name"),)

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(30))
    transaction_type: Mapped[TransactionType] = mapped_column(
        SQLAlchemyEnum(TransactionType, name="transaction_type")
    )
    necessity_index: Mapped[NecessityLevel | None] = mapped_column(
        SQLAlchemyEnum(NecessityLevel, name="necessity_level"), nullable=True
    )
    source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user: Mapped["User"] = relationship(back_populates="categories")
    # No delete cascade: deleting a category must never delete transactions.
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="category")
