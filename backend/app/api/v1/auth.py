from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.cookies import clear_auth_cookie, set_auth_cookie
from app.api.deps import SessionDep
from app.models import User
from app.schemas.users import UserCreate, UserOut
from app.services import auth as auth_service
from app.services import users as users_service

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=UserOut)
async def signup(data: UserCreate, db: SessionDep) -> User:
    return await users_service.signup(db, data)


@router.post("/login")
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], db: SessionDep, response: Response
) -> dict[str, str]:
    # OAuth2's form calls the field "username"; ours holds the email.
    token = await auth_service.login(db, form.username, form.password)
    set_auth_cookie(response, token)
    return {"message": "Logged in"}


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    clear_auth_cookie(response)
    return {"message": "Logged out"}
