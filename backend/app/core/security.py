from passlib.context import CryptContext
from dotenv import load_dotenv
import os
from fastapi import HTTPException

pwd_context  = CryptContext(schemes=['bcrypt'])

def hash_password(password:str):
    hashed_password = pwd_context.hash(password)
    return hashed_password

def verify_password(plain:str, hashed:str):
    return pwd_context.verify(plain,hashed)