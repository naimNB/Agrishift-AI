# AgriShift AI — Production Dockerfile
# ==============================================================================
# Multi-stage/hardened container for FastAPI backend deployment on Google Cloud Run,
# Render, AWS ECS, or Docker Compose.
# ==============================================================================

FROM python:3.11-slim-bookworm

# Prevent Python from writing .pyc files and enable unbuffered terminal logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    WEB_CONCURRENCY=1 \
    ENVIRONMENT=production

# Install curl for container health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root service user for principle of least privilege
RUN useradd -u 10001 -m -s /bin/bash appuser

WORKDIR /app

# Copy dependency specifications first to leverage Docker layer caching
COPY requirements.txt /app/requirements.txt

# Install production dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . /app

# Grant application user ownership of workdir
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose default HTTP port
EXPOSE 8000

# Container health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health/liveness || exit 1

# Launch uvicorn with 1 worker to ensure memory stays safely within Render Free 512 MB limit
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-1} --proxy-headers"]
