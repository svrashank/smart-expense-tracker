from pydantic import  EmailStr
from app.schemas.delete import UserDelete
from app.dependencies import get_db
from sqlalchemy.ext.asyncio import AsyncSession 
from app.model.users import User
async def delete_user(user_data: UserDelete, db: AsyncSession) -> None:
    user_email = user_data.email
    stmt = select(User).where(User.email.in_([user_email]))

