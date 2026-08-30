from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from typing import Annotated
from starlette.middleware.sessions import SessionMiddleware

from study_guide_llm.configs import SECRET_KEY, MAX_AGE, FRONTEND_URI
from study_guide_llm.app.db import get_session
from study_guide_llm.routers.auth import router as auth_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=SECRET_KEY, 
    max_age=int(MAX_AGE),
    session_cookie="user_auth",
    same_site="lax", # default
    https_only=False, # TODO: change to True when deploying,
)

app.include_router(auth_router)

session = get_session()

sessionDep = Annotated[Session, Depends(get_session)]

@app.get("/")
def home():
    return {"message": "Hello World"}

@app.get("/chat")
def get_chat():
    return {"message": "Hello Chat"}