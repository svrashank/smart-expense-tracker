"""User account rules: signup and deletion."""

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import IncorrectPassword, UserAlreadyExists
from app.core.security import hash_password, verify_password
from app.crud import users as users_crud
from app.models import User
from app.schemas.users import UserCreate


async def signup(db: AsyncSession, data: UserCreate) -> User:
    if await users_crud.get_by_email(db, data.email) is not None:
        raise UserAlreadyExists()
    user = await users_crud.create(db, email=data.email, password_hash=hash_password(data.password))
    try:
        await db.commit()
    except IntegrityError:
        # Two signups with the same email at the same moment: both pass the
        # check above, and the unique constraint stops the second one here.
        await db.rollback()
        raise UserAlreadyExists() from None
    return user


async def delete_account(db: AsyncSession, user: User, password: str) -> None:
    if not verify_password(password, user.password_hash):
        raise IncorrectPassword()
    await users_crud.delete(db, user.id)
    await db.commit()
