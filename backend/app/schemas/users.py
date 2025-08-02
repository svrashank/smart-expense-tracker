from pydantic import BaseModel,Field, EmailStr,ConfigDict
from enum import Enum

class UserCreate(BaseModel):
    email : EmailStr
    password : str

class UserOut(BaseModel):
    email : EmailStr
    model_config = ConfigDict(from_attributes = True)

class UserDelete(BaseModel):
    email : EmailStr
    username : str | None = None

class Userlogin(BaseModel):
    email : EmailStr
    password : str 

class UserGet(BaseModel):
    email : EmailStr
    username : str | None = None 
    
class UserGetLogin(BaseModel):
    email: EmailStr
    username : str | None = None
