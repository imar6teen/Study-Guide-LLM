from study_guide_llm.app.db import verify_user
from fastapi import APIRouter, Query, Form, Depends, Response, BackgroundTasks
from starlette.requests import Request
from fastapi.responses import RedirectResponse
from typing import Annotated
from sqlmodel import Session, select
import bcrypt

from study_guide_llm.app.db import get_session, is_user_exist, delete_user
from study_guide_llm.models import Users
from study_guide_llm.app.types.auth import Signup, Login
from study_guide_llm.configs import DEFAULT_IMAGE, FRONTEND_URI
from study_guide_llm.utils import verification_token, send_email_verification


router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={404: {"description": "Not Found"}},
)
sessionDep = Annotated[Session, Depends(get_session)]

@router.post("/login")
def login(session: sessionDep, data : Login, request : Request, response : Response):
    user : Users | None = session.exec(select(Users).where(Users.username == data.username)).first()

    # TODO make the error schema same with fastapi when validation error (or vice versa)
    if not user:
        response.status_code = 404
        return {"message": ["User not found"], "field": ["username"]}
    if not user.email_verified:
        response.status_code = 403
        return {"message": ["Email not verified"]}
    is_password_validate = bcrypt.checkpw(data.password.encode("utf-8"), user.password.encode('utf-8'))
    if not is_password_validate:
        response.status_code = 401
        return {"message": ["Invalid password"], "field": ["password"]}

    request.session["user"] = {
        "id" : str(user.users_id),
        "username" : user.username,
        "email" : user.email,
        "name" : user.name
    }
    
    return {"message": ["Login successful"]}

@router.post("/signup")
def signup(session: sessionDep, response : Response, data : Signup, bgt : BackgroundTasks):
    try:
        is_email_exist = is_user_exist(session, "email", data.email)
        is_username_exist = is_user_exist(session, "username", data.username)
        
        # TODO make the error schema same with fastapi when validation error (or vice versa)
        if is_email_exist and is_username_exist:
            response.status_code = 400
            return {
                "field": ["email", "username"],
                "message": ["Email already exists", "Username already exists"]}
        elif is_email_exist:
            response.status_code = 400
            return {"message": ["Email already exists"], "field": ["email"]}
        elif is_username_exist:
            response.status_code = 400
            return {"message": ["Username already exists"], "field": ["username"]}

        password_byte = data.password.encode("utf-8")
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password_byte, salt).decode()

        new_user : Users = Users(
            name = data.name,
            email = data.email,
            username = data.username,
            password = hashed_password,
            img_filename = DEFAULT_IMAGE,
            email_verified = False
        )
        
        session.add(new_user)
        session.commit()

        # TODO implement resending email verification
        bgt.add_task(send_email_verification, data.email)

        return {"message": ["User created successfully. Please verify your email for login."]}
    except Exception as e:
        # TODO make sure deleting user is success, use background task
        delete_user(session, data.email)
        print(e)
        return {"message" : ["Something went wrong. Please try again later"]}


@router.get("/me")
def me(session: sessionDep, request : Request):
    # print(request.["user"])
    return
    
@router.get("/verify-email")
def verify_email(session : sessionDep, token : str):
    email = verification_token(token)
    
    if not email:
        # TODO create page for invalid token
        return {"message": "Invalid token. Please signup"}

    is_email_verified = verify_user(session, email)

    if not is_email_verified:
        # TODO create page for user can't be verified
        return {"message": "User can't be verified"}

    return RedirectResponse(f"{FRONTEND_URI}/app/signin?verified=1")