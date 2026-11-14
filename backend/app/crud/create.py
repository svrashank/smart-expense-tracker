from app.models import User  
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.users import UserCreate
from app.core.security import hash_password
from fastapi import HTTPException, status
from app.services.auth import user_exists

async def create_user(db: AsyncSession, user: UserCreate) -> User:
    """
    Takes in the user from UserCreate , hashes password and creates a user in
    """
    user_in_db = await user_exists(db,user.email)
    if user_in_db:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, 
            detail = {"code": "USER_EXISTS",
                    "message": "User already exists. Please login."
                    })
    hashed_pwd = hash_password(user.password)
    new_user = User(email = user.email,password_hash = hashed_pwd)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user
