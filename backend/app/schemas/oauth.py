from pydantic import BaseModel, EmailStr
class AccessTokenData(BaseModel):
    email :EmailStr 

class TokenData(BaseModel):
    email :EmailStr

class Token(BaseModel):
    access_token : str 
    token_type : str 