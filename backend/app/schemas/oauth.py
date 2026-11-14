from pydantic import BaseModel
class AccessTokenData(BaseModel):
    id : int

class TokenData(BaseModel):
    id : int

class Token(BaseModel):
    access_token : str 
    token_type : str 