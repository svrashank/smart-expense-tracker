from pydantic import  EmailStr
from app.schemas.users import UserDelete
from app.dependencies import get_db
from sqlalchemy.ext.asyncio import AsyncSession 
from app.models.users import User
from sqlalchemy import select,delete
from app.services.auth import user_exists_by_id
from fastapi import HTTPException, status

async def delete_user(user_data: UserDelete, db: AsyncSession) -> None:
    id = user_data.id
    if not await user_exists_by_id(db,id=id):
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND,
                            detail = f"User Not found")
    stmt = delete(User).where(User.id == id)
    results = await db.execute(stmt)
    await db.commit()
    return results.rowcount