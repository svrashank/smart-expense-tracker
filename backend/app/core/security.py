from passlib.context import CryptContext
from dotenv import load_dotenv
import os
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import HTTPException,Depends,status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated, EmailStr
from datetime import datetime, timedelta, timezone
from app.crud.read import user_exists, get_user_from_db_login, get_user_from_db
from app.schemas.users import UserGet, Userlogin
from app.schemas.oauth import TokenData, Token
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User
from sqlalchemy import select 
load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
EXPIRES_DELTA = os.getenv("EXPIRES_DELTA")
pwd_context  = CryptContext(schemes=['bcrypt'])

def hash_password(password:str):
    hashed_password = pwd_context.hash(password)
    return hashed_password

def verify_password(plain:str, hashed:str):
    return pwd_context.verify(plain,hashed)


async def create_access_token(data:dict, expires_delta: timedelta | None = None ):
    to_encode = data.copy()
    if expires_delta:
        expires = datetime.now(timezone.utc) + expires_delta
    else:
        expires = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp":expires})
    encoded_jwt = jwt.encode(payload = to_encode,key=SECRET_KEY,algorithms=["HS256"])
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
async def get_current_user(token : Annotated[str,Depends(oauth2_scheme)]) :
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = None
    try:
        decoded_payload = jwt.decode(token,algorithms="H256",key=SECRET_KEY)
        user_email = decoded_payload.get('sub')
        if not user_email:
            raise credentials_exception
        token_data = TokenData(email = user_email)
    except InvalidTokenError:
        raise credentials_exception
    user = await get_user_from_db(email = token_data.email)
    if not user:
        raise credentials_exception
    return user

async def authenticate_user(email,password,db) -> UserGet:
    statement = select(User).where(User.email == email)
    results = await db.execute(statement)
    user = results.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND,
                            detail = f'User with email {email} does not exists')
    if not verify_password(password,user.password):
        raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED,detail = "Invalid Credentials")
    user_data  = UserGet(email=user.email,username=user.username)
    return user_data 

async def login_user(email:EmailStr, password: str, db: AsyncSession) -> Token:
    user = await authenticate_user(email,password,db)
    if user:
        data = {"sub":user.email}
        expires_delta = timedelta(minutes=int(EXPIRES_DELTA))
        access_token = await create_access_token(data,expires_delta)
        return Token(access_token=access_token, token_type = "Bearer")