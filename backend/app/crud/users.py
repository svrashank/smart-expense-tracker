"""Queries for the users table. No business rules, no commits: the calling
service decides when the transaction ends."""

from sqlalchemy import delete as sql_delete
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


async def get_by_id(db: AsyncSession, user_id: int) -> User | None:
    return await db.get(User, user_id)


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, *, email: str, password_hash: str) -> User:
    user = User(email=email, password_hash=password_hash)
    db.add(user)
    await db.flush()  # sends the INSERT so user.id is set; the service still commits
    return user


async def delete(db: AsyncSession, user_id: int) -> None:
    await db.execute(sql_delete(User).where(User.id == user_id))
