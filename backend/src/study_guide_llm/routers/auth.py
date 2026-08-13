from fastapi import APIRouter, Query, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from enum import Enum
from typing import Annotated

class QueryParams(BaseModel):
    id : str

class UserForm(BaseModel):
    username : str
    age : int

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"

class User(BaseModel):
    username : str
    email : str
    age : int
    sex : Gender

# In-memory storage for demo purposes
users_db = []

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={404: {"description": "Not Found"}}
)

@router.post("/login")
def login():
    return JSONResponse({"message": "Login"})

@router.get("/{item_id}")
def tes(item_id : int):
    return JSONResponse({
        "id" : item_id,
        "type" : str(type(item_id))
    })

@router.post("/create")
def create(user : User):
    users_db.append(user)
    return JSONResponse({
        "id" : len(users_db) - 1,
        "message" : "User created successfully",
    })

@router.get("/query")
def query(query_params : Annotated[QueryParams, Query()]):
    return {
        "item_id" : query_params.id,
    }

@router.post("/form")
def form(
    user_form : Annotated[UserForm, Form()]
):
    return {
        "username" : user_form.username,
        "age" : user_form.age
    }