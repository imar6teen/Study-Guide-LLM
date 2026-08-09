from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={404: {"description": "Not Found"}}
)

@router.post("/login")
def login():
    return JSONResponse({"message": "Login"})