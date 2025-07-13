from app.models import User  
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.users import UserCreate
from sqlalchemy import select
from app.core.security import *
from fastapi import HTTPException, status
from pydantic import EmailStr
async def create_user(db: AsyncSession, user: UserCreate) -> User:
    """
    Takes in the user from UserCreate , hashes password and creates a user in
    """
    user_in_db = await user_exists(db,user.email)
    if user_in_db:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, 
            detail = f"Email already registered {user_in_db}"
        )
    hashed_pwd = hash_password(user.password)
    new_user = User(email = user.email,password_hash = hashed_pwd)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def user_exists(db:AsyncSession, email: EmailStr):
    stmt = select(User).where(User.email.in_([email]))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()