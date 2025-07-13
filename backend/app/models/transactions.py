from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, DateTime, Float, ForeignKey, Enum as SQLAlchemyEnum
from datetime import datetime
from typing import List, Optional
from enum import Enum
from app.models.base import Base

class ModeOfPurchase(str, Enum):
    ONLINE = 'online'
    OFFLINE = 'offline'

class NecessityLevel(str, Enum):
    HIGH = 'high'
    MEDIUM = 'medium'
    LOW = 'low'

class TransactionType(str, Enum):
    INCOME = 'income'
    EXPENSE = 'expense'

class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id : Mapped[int] = mapped_column(primary_key = True, unique = True)
    date : Mapped[datetime] = mapped_column(DateTime,default = datetime.utcnow)
    user_id : Mapped[int] = mapped_column(ForeignKey("users.id"),nullable = False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.category_id"))
    category : Mapped["Category"] = relationship(back_populates = "transactions", lazy="selectin")
    amount : Mapped[float] = mapped_column(Float,nullable = False)
    mode_of_purchase :Mapped[Optional[str]] = mapped_column(SQLAlchemyEnum(ModeOfPurchase,name="mode_of_purchase",nullable = True))
    user : Mapped["User"] = relationship(back_populates = "transactions",lazy = 'selectin')

class Category(Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(30))
    category_id : Mapped[int] = mapped_column(Integer, primary_key = True, unique = True)

    transaction_type: Mapped[str] = mapped_column(SQLAlchemyEnum(TransactionType,name ='transaction_type'))
    transactions : Mapped[List['Transaction']] = relationship(back_populates = "category",cascade = 'all, delete-orphan', lazy="selectin")

    necessity_index : Mapped[Optional[NecessityLevel]] = mapped_column(SQLAlchemyEnum(NecessityLevel,name = 'necessity_level',nullable = True)) 
    source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)