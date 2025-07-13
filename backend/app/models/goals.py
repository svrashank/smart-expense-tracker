from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, DateTime, Float, ForeignKey, Enum as SQLAlchemyEnum
from datetime import datetime
from typing import List, Optional
from enum import Enum
from app.models.base import Base

class Goal(Base):
    __tablename__ = "goals"

    goal_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column()
    target_amount: Mapped[float] = mapped_column()
    target_date: Mapped[datetime] = mapped_column()
    description: Mapped[Optional[str]] = mapped_column()

    user: Mapped["User"] = relationship(back_populates = "goals")