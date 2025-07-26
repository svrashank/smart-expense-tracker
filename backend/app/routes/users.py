from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
from app.schemas.users import UserCreate, UserOut
from app.crud.create import create_user
from pydantic import EmailStr
from app.models.users import User
from app.schemas.users import UserDelete
from app.crud.delete import delete_user
router = APIRouter()
@router.get("/user")
async def get_user(email: EmailStr,db : AsyncSession = Depends(get_db)):
    statement = select(User).where(User.email == email)
    results = await db.execute(statement)
    users = results.scalars().all()
    return users

@router.post("/signup", status_code = status.HTTP_201_CREATED)
async def post_new_user(form_data:UserCreate,db : AsyncSession = Depends(get_db)):
    user = await create_user(db,form_data)
    return UserOut.model_validate(user)

@router.delete("/delete_user",status_code= status.HTTP_200_OK)
async def delete_current_user(user_data:UserDelete, db : AsyncSession =  Depends(get_db)):
    response = await delete_user(user_data,db)
    return response