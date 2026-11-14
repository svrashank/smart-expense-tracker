from pydantic import BaseModel,EmailStr,ConfigDict

class UserCreate(BaseModel):
    email : EmailStr
    password : str

class UserOut(BaseModel):
    email : EmailStr
    model_config = ConfigDict(from_attributes = True)

class UserDelete(BaseModel):
    model_config = ConfigDict(extra="forbid")
    password : str

class Userlogin(BaseModel):
    email : EmailStr
    password : str 

class UserGet(BaseModel):
    id : int
    email : EmailStr
    name : str | None = None 
    
class UserGetLogin(BaseModel):
    email: EmailStr
    name : str | None = None
