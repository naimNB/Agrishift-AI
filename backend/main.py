from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import nasa, auth, predictions, risk, advisory, farms
from app.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables
    create_tables()
    yield
    # Shutdown: cleanup


app = FastAPI(
    title="AgriShift AI Backend",
    description="NASA-powered agriculture intelligence API for North Bengal",
    version="1.0.0",
    lifespan=lifespan,
)

# React frontend (localhost:5173) allow করা হচ্ছে
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes register
app.include_router(auth.router,        prefix="/api/auth",        tags=["Authentication"])
app.include_router(nasa.router,        prefix="/api/nasa",        tags=["NASA Data"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(risk.router,        prefix="/api/risk",        tags=["Climate Risk"])
app.include_router(advisory.router,    prefix="/api/advisory",    tags=["Farmer Advisory"])
app.include_router(farms.router,       prefix="/api/farms",       tags=["Farms"])


@app.get("/")
def root():
    return {
        "message": "AgriShift AI Backend is running 🌾",
        "docs": "/docs",
        "region": "North Bengal, Bangladesh",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
