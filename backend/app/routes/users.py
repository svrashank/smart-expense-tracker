from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
from app.schemas.users import UserCreate, UserOut
from app.crud.create import create_user
router = APIRouter()
@router.get("/user")
async def get_user(db : AsyncSession = Depends(get_db)):
    statement = select(User)
    results = await db.execute(statement)
    user = results.scalars().all()
    return users

@router.post("/signup", status_code = status.HTTP_201_CREATED)
async def post_new_user(form_data:UserCreate,db : AsyncSession = Depends(get_db)):
    user = await create_user(db,form_data)
    return UserOut.model_validate(user)
