from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.users import User


class Goal(Base):
    __tablename__ = "goals"

    goal_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column()
    target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    saved_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), server_default="0")
    target_date: Mapped[date] = mapped_column()
    description: Mapped[str | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="goals")
