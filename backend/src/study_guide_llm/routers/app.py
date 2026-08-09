from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(
    prefix="/app",
    tags=["app"],
    responses={404: {"description": "Not Found"}}
)

router.frontend("/", directory="src/study_guide_llm/html")