from fastapi import APIRouter, Response

from app.api.cookies import clear_auth_cookie
from app.api.deps import CurrentUser, SessionDep
from app.models import User
from app.schemas.users import UserDelete, UserOut
from app.services import users as users_service

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def read_me(current_user: CurrentUser) -> User:
    return current_user


@router.post("/me/delete")
async def delete_me(
    body: UserDelete, current_user: CurrentUser, db: SessionDep, response: Response
) -> dict[str, str]:
    await users_service.delete_account(db, current_user, body.password)
    clear_auth_cookie(response)
    return {"message": "Account deleted"}
