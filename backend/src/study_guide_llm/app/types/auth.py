from pydantic import BaseModel, Field, EmailStr



class Signup(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)



class Login(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
