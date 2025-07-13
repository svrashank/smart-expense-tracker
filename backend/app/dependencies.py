from app.core.database import async_session
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
