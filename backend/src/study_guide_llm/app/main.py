from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from study_guide_llm.routers.auth import router as auth_router
from study_guide_llm.routers.app import router as app_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(app_router)