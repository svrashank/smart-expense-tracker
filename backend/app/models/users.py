from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, DateTime, Float, ForeignKey, Enum as SQLAlchemyEnum
from datetime import datetime
from typing import List, Optional
from enum import Enum
from app.models.base import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30),nullable = True)
    email: Mapped[str] = mapped_column(String(30),unique = True, nullable = False, index = True)
    fullname: Mapped[Optional[str]] = mapped_column(String(30),nullable = True)
    password_hash : Mapped[str] = mapped_column(String(128),nullable = False)
    age : Mapped[Optional[int]] = mapped_column(Integer, nullable = True)
    is_active : Mapped[bool] = mapped_column(Boolean, default = True)
    created_at : Mapped[datetime] = mapped_column(DateTime, default = datetime.utcnow)
    transactions : Mapped[List["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[List['Goal']] = relationship(back_populates="user", cascade="all, delete-orphan")
    budget : Mapped[List['Budget']] =  relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"User(id={self.id!r}, email={self.email!r}, active={self.is_active!r})"
