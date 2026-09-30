from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email : EmailStr
    username : str
    password : str


class UserResponse(BaseModel):
    id: int
    email : EmailStr
    username : str
    is_active : bool