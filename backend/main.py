import time
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.routers import nasa, auth, predictions, risk, advisory, farms, rotation
from app.database import create_tables, check_database_health


# ── Structured Application Logging ───────────────────────────────────────────
logger = logging.getLogger("agrishift")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [agrishift] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs incoming HTTP requests, response statuses, and processing latency."""
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path

        try:
            response: Response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            response.headers["X-Response-Time-Ms"] = str(duration_ms)
            if not path.startswith("/health"):
                logger.info(f"{method} {path} - {response.status_code} ({duration_ms}ms) [{client_ip}]")
            return response
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"{method} {path} - FAILED {exc} ({duration_ms}ms) [{client_ip}]", exc_info=True)
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Validate security and create DB tables
    settings.validate_security()
    create_tables()
    logger.info(f"AgriShift AI Backend initialized (Environment: {settings.ENVIRONMENT})")
    yield
    # Shutdown: cleanup
    logger.info("AgriShift AI Backend shutting down")


app = FastAPI(
    title="AgriShift AI Backend",
    description="NASA-powered agriculture intelligence API for Bangladesh",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(RequestLoggingMiddleware)

# CORS: supports local web dashboards, Android clients, and configurable production domains
is_wildcard = "*" in settings.cors_origins_list
if is_wildcard:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ── Routes Registration ──────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",        tags=["Authentication"])
app.include_router(nasa.router,        prefix="/api/nasa",        tags=["NASA Data"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(risk.router,        prefix="/api/risk",        tags=["Climate Risk"])
app.include_router(advisory.router,    prefix="/api/advisory",    tags=["Farmer Advisory"])
app.include_router(farms.router,       prefix="/api/farms",       tags=["Farms"])
app.include_router(rotation.router,    prefix="/api/rotations",   tags=["Crop Rotations"])
app.include_router(rotation.router,    prefix="/api/predictions/rotations", tags=["Crop Rotations"])


@app.get("/")
def root():
    return {
        "message": "AgriShift AI Backend is running 🌾",
        "docs": "/docs",
        "region": "Bangladesh",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


# ── Health Probes (Container / Orchestrator Readiness & Liveness) ────────────
@app.get("/health")
def health_check(response: Response, details: bool = False):
    """
    Standard health check. Returns status: ok.
    Pass ?details=true for full environment, database, and telemetry metadata.
    """
    db_ok = check_database_health()
    if not db_ok:
        response.status_code = 503
        status_str = "degraded"
    else:
        status_str = "ok"

    if details:
        return {
            "status": status_str,
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0",
            "database": "connected" if db_ok else "unreachable",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    return {"status": status_str}


@app.get("/health/liveness")
def liveness_probe():
    """Kubernetes/Cloud Run container liveness probe."""
    return {"status": "alive"}


@app.get("/health/readiness")
def readiness_probe(response: Response):
    """Kubernetes/Cloud Run container readiness probe."""
    db_ok = check_database_health()
    if not db_ok:
        response.status_code = 503
        return {
            "status": "not_ready",
            "database": "unreachable",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    return {
        "status": "ready",
        "database": "connected",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
