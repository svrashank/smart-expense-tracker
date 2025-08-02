from pydantic import  EmailStr
from app.schemas.users import UserDelete
from app.dependencies import get_db
from sqlalchemy.ext.asyncio import AsyncSession 
from app.models.users import User
from sqlalchemy import select,delete
from app.crud.create import user_exists
from fastapi import HTTPException, status

async def delete_user(user_data: UserDelete, db: AsyncSession) -> None:
    user_email = user_data.email
    if not user_exists(db,user_email):
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND,
                            detail = f"User with email {user_email} does not exist")
    stmt = delete(User).where(User.email.in_([user_email]))
    results = await db.execute(stmt)
    await db.commit()
    return results.rowcount
