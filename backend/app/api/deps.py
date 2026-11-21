"""FastAPI dependencies shared by all routers."""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.cookies import AuthCookie
from app.core.database import async_session
from app.core.exceptions import NotAuthenticated
from app.models import User
from app.services import auth as auth_service


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(db: SessionDep, token: AuthCookie = None) -> User:
    if token is None:
        raise NotAuthenticated()
    user = await auth_service.get_user_from_token(db, token)
    if user is None:
        raise NotAuthenticated()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

