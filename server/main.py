import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from db.engine import engine
from db.models import init_coach_tables
from routers import activities, coach, calendar
from routers import memory as memory_router

app = FastAPI(
    title="AI Running Coach API",
    version="0.2.0",
    description="AI 私教跑步 App 后端服务",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if not settings.api_key:
        return await call_next(request)

    path = request.url.path
    if path in ("/", "/health", "/docs", "/openapi.json", "/redoc"):
        return await call_next(request)

    if path.startswith("/api/"):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer ") or auth[7:] != settings.api_key:
            return JSONResponse(status_code=401, content={"detail": "Invalid or missing API key"})

    return await call_next(request)


app.include_router(activities.router)
app.include_router(coach.router)
app.include_router(calendar.router)
app.include_router(memory_router.router)


@app.on_event("startup")
def startup():
    init_coach_tables(engine)


@app.get("/")
def root():
    return {
        "name": "AI Running Coach API",
        "version": "0.2.0",
        "status": "running",
        "db_path": settings.db_path,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
