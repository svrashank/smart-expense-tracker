from app.models import User  
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.users import Userlogin
from sqlalchemy import select
from app.core.security import *
from fastapi import HTTPException, status
from pydantic import EmailStr
from app.crud.create import user_exists
from app.core.security import verify_password
from app.schemas.users import UserGet, UserGetLogin

async def get_user_from_db(email:EmailStr,db:AsyncSession) -> UserGet:
    statement = select(User).where(User.email == email)
    results = await db.execute(statement)
    user = results.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND,
                            detail = f'User with email {email} does not exists')

    user_get = UserGet(email=user.email,username = user.username) 
    return user_get

# async def get_user_from_db_login(email:EmailStr,db:AsyncSession) -> UserGet:
#     statement = select(User).where(User.email == email)
#     results = await db.execute(statement)
#     user = results.scalar_one_or_none()
#     if not user:
#         raise HTTPException(status_code = status.HTTP_404_NOT_FOUND,
#                             detail = f'User with email {email} does not exists')

#     user_get = UserGetLogin(email=user.email,username = user.username, password = user.password) 
#     return user_get








