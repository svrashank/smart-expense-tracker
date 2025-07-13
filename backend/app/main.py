from fastapi import FastAPI
from app.routes import users
app = FastAPI()

@app.get("/ping")
def ping():
    return {"message": "ping"}

app.include_router(users.router, prefix = '/auth', tags = ['User'])