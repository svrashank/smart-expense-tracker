"""Authentication rules. Knows nothing about HTTP or cookies."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import InvalidCredentials
from app.core.security import create_access_token, decode_access_token, verify_password
from app.crud import users as users_crud
from app.models import User


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await users_crud.get_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise InvalidCredentials()
    return user


async def login(db: AsyncSession, email: str, password: str) -> str:
    """Check the credentials and return a new access token."""
    user = await authenticate(db, email, password)
    return create_access_token(subject=str(user.id))


async def get_user_from_token(db: AsyncSession, token: str) -> User | None:
    user_id = decode_access_token(token)
    if user_id is None or not user_id.isdigit():
        return None
    return await users_crud.get_by_id(db, int(user_id))
