from app.services.auth import get_user_by_id
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.crud.delete import delete_user
from app.core.security import verify_password

async def delete_account(user_id: int, password: str, db : AsyncSession) -> int:
        user = await get_user_by_id(db, id=user_id)
        if not user:
            raise HTTPException(status_code = status.HTTP_404_NOT_FOUND,
                                detail = f"User Not found")
        hashed_password = user.password_hash
        if not verify_password(password, hashed_password):
            raise HTTPException(status_code = status.HTTP_403_FORBIDDEN,
                                detail = "Invalid Credentials")
        deleted_rows = await delete_user(user_id, db)
        return deleted_rows