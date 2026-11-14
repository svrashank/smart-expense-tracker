from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
from app.schemas.users import UserCreate, UserOut, UserGet
from app.crud.create import create_user
from app.schemas.users import UserDelete
from app.services.auth import login_user, get_current_user as __get_current_user
from typing import Annotated
from fastapi.responses import JSONResponse
from app.services.users import delete_account

from fastapi.security import OAuth2PasswordRequestForm
router = APIRouter()
@router.get("/user",response_model = UserGet)
async def get_user(current_user: Annotated[UserGet,Depends(__get_current_user)],db : AsyncSession = Depends(get_db)):
    return current_user

@router.post("/signup", status_code = status.HTTP_201_CREATED)
async def post_new_user(form_data:UserCreate,db : AsyncSession = Depends(get_db)):
    user = await create_user(db,form_data)
    return UserOut.model_validate(user)

@router.post("/delete_account",status_code= status.HTTP_200_OK)
async def delete_current_user(body: UserDelete,current_user:Annotated[UserGet,Depends(__get_current_user)], db : AsyncSession =  Depends(get_db)):
    await delete_account(current_user.id, body.password, db)
    response = JSONResponse(content ={"message": "Account deleted"})
    response.delete_cookie(
            key= 'access_token',
            httponly = True,
            secure = True,
            samesite='lax',
            path ='/')
    return response
@router.post("/login")
async def login_form_user(form_data: OAuth2PasswordRequestForm = Depends(), db : AsyncSession = Depends(get_db)):
    email = form_data.username
    password = form_data.password
    login_access_token = await login_user(email,password, db)
    response = JSONResponse(content={"message": "Success"})
    response.set_cookie(
        key= 'access_token',
        value = login_access_token.access_token,
        httponly = True,
        secure = True,
        samesite='lax',
        max_age = 60 * 60,
        path ='/')
    response.status_code = status.HTTP_200_OK
    response.body = b'{"message":"Success"}'
    response.headers['content-type'] = 'application/json'
    return response

@router.get("/current_user",response_model = UserGet)
async def get_current_user(current_user: Annotated[UserGet,Depends(__get_current_user)],db: AsyncSession = Depends(get_db)):
    return current_user