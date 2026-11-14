from sqlalchemy.ext.asyncio import AsyncSession 
from app.models.users import User
from sqlalchemy import delete

async def delete_user(id: int, db: AsyncSession) -> int:
    stmt = delete(User).where(User.id == id)
    results = await db.execute(stmt)
    await db.commit()
    return results.rowcount