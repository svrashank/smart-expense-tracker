from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db

@app.get("/user")
async def get_user(db : AsyncSession = Depends(get_db)):
    statemeent = select(User)
    results = await db.execute(statemeent)
    user = results.scalars().all()
    return users

