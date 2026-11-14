# app/database.py

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


DATABASE_URL = settings.DATABASE_URL
LOG_SQL = settings.LOG_SQL
# For async: must use asyncpg and postgresql+asyncpg
engine = create_async_engine(DATABASE_URL, echo=LOG_SQL)

async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

