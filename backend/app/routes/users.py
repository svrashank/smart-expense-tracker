from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
from app.schemas.users import UserCreate, UserOut, UserGet
from app.crud.create import create_user
from pydantic import EmailStr
from app.models.users import User
from app.schemas.users import UserDelete, Userlogin
from app.crud.delete import delete_user
from app.crud.read import get_user_from_db
from app.core.security import login_user 
from fastapi.security import OAuth2PasswordRequestForm
router = APIRouter()
@router.get("/user",response_model = UserGet)
async def get_user(email: EmailStr,db : AsyncSession = Depends(get_db)):
    users = await get_user_from_db(email,db)
    return users

@router.post("/signup", status_code = status.HTTP_201_CREATED)
async def post_new_user(form_data:UserCreate,db : AsyncSession = Depends(get_db)):
    user = await create_user(db,form_data)
    return UserOut.model_validate(user)

@router.delete("/delete_user",status_code= status.HTTP_200_OK)
async def delete_current_user(user_data:UserDelete, db : AsyncSession =  Depends(get_db)):
    response = await delete_user(user_data,db)
    return response

@router.post("/login")
async def login_form_user(form_data: OAuth2PasswordRequestForm = Depends(), db : AsyncSession = Depends(get_db)):
    email = form_data.username
    password = form_data.password
    login_access_token = await login_user(email,password, db)
    return {"access_token":login_access_token.access_token,"token_type":login_access_token.token_type}

