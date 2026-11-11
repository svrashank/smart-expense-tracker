import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import HTTPException,Depends,status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from pydantic import EmailStr
from datetime import datetime, timedelta, timezone
from app.crud.read import get_user_from_db
from app.schemas.users import UserGet
from app.schemas.oauth import TokenData, Token
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User
from sqlalchemy import select 
from fastapi import Request
from app.dependencies import get_db
from app.core.config import Settings
from app.core.security import verify_password
settings = Settings()
SECRET_KEY = settings.JWT_SECRET_KEY
EXPIRES_DELTA = settings.EXPIRES_DELTA

async def create_access_token(data:dict, expires_delta: timedelta | None = None ):
    to_encode = data.copy()
    if expires_delta:
        expires = datetime.now(timezone.utc) + expires_delta
    else:
        expires = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp":expires})
    encoded_jwt = jwt.encode(payload = to_encode,key=SECRET_KEY,algorithm='HS256')
    return encoded_jwt


async def get_token_from_cookie(request: Request):
    """
    Fetch Token stored in Cookie while login
    """
    token = request.cookies.get("access_token")
    print("COOKIE TOKEN:", token)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
async def get_current_user(
        token: Annotated[str, Depends(get_token_from_cookie)],
        db: Annotated[AsyncSession, Depends(get_db)]
    ) -> UserGet:    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = None
    try:
        decoded_payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_email = decoded_payload.get('sub')
        if not user_email:
            raise credentials_exception
        token_data = TokenData(email = user_email)
    except InvalidTokenError:
        raise credentials_exception
    user = await get_user_from_db(email = token_data.email,db=db)
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
    if not verify_password(password,user.password_hash):
        raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED,detail = "Invalid Credentials")
    user_data  = UserGet(email=user.email,name=user.name)
    return user_data 

async def login_user(email:EmailStr, password: str, db: AsyncSession) -> Token:
    user = await authenticate_user(email,password,db)
    if user:
        data = {"sub":user.email}
        expires_delta = timedelta(minutes=int(EXPIRES_DELTA))
        access_token = await create_access_token(data,expires_delta)
        return Token(access_token=access_token, token_type = "Bearer")

async def user_exists(db:AsyncSession, email: EmailStr):
    stmt = select(User).where(User.email.in_([email]))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def user_exists_by_id(db:AsyncSession, id: str):
    stmt = select(User).where(User.id == id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()