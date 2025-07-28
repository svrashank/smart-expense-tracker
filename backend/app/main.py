from fastapi import FastAPI
from app.routes import users
import os 
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
FRONTEND_PORT = os.getenv("FRONTEND_PORT")
app = FastAPI()

origins = [
    f"http://localhost:{FRONTEND_PORT}",
    f"http://127.0.0.1:{FRONTEND_PORT}",   
]
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]

)
@app.get("/ping")
def ping():
    return {"message": "ping"}

app.include_router(users.router, prefix = '/auth', tags = ['User'])