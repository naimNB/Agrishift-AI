"""
test_cloud_deployment.py — Cloud Deployment Readiness & Security Safeguards
=============================================================================
Tests production security validation, CORS parsing, structured health probes,
request timing middleware, and NASA telemetry in-memory caching.
"""

import pytest
import warnings
from unittest.mock import AsyncMock, patch, MagicMock
from starlette.testclient import TestClient

from app.config import Settings, INSECURE_DEFAULT_KEYS
from app.database import check_database_health
from app.services.nasa_service import (
    fetch_nasa_power_data,
    get_cached_telemetry,
    set_cached_telemetry,
    clear_nasa_cache,
)


def test_production_security_validation_fails_on_default_key():
    """Verifies that running in production with default or weak keys raises ValueError."""
    for bad_key in INSECURE_DEFAULT_KEYS:
        s = Settings(ENVIRONMENT="production", SECRET_KEY=bad_key)
        with pytest.raises(ValueError, match="CRITICAL SECURITY FAILURE"):
            s.validate_security()

    # Short custom key (< 32 characters) must also fail in production
    s_short = Settings(ENVIRONMENT="production", SECRET_KEY="short-secret-key-12345")
    with pytest.raises(ValueError, match="CRITICAL SECURITY FAILURE"):
        s_short.validate_security()


def test_production_security_validation_succeeds_on_strong_key():
    """Verifies that a 32+ character random secret key passes production security validation."""
    strong_key = "a8f3b2c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcde"
    s = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=strong_key,
        DATABASE_URL="postgresql://user:pass@host:5432/db",
    )
    # Should not raise
    s.validate_security()


def test_production_sqlite_storage_warning():
    """Verifies that using SQLite in production warns the operator about ephemeral storage."""
    strong_key = "a8f3b2c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcde"
    s = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=strong_key,
        DATABASE_URL="sqlite:///./ephemeral.db",
    )
    with pytest.warns(UserWarning, match="PRODUCTION STORAGE NOTICE"):
        s.validate_security()


def test_cors_origins_parsing():
    """Tests parsing comma-separated CORS origins and wildcard fallback."""
    # Wildcard
    s_wild = Settings(CORS_ORIGINS="*")
    assert s_wild.cors_origins_list == ["*"]

    # Comma-separated domains
    s_custom = Settings(CORS_ORIGINS="https://agrishift.web.app, https://myfarm.com, http://localhost:5173 ")
    assert s_custom.cors_origins_list == [
        "https://agrishift.web.app",
        "https://myfarm.com",
        "http://localhost:5173",
    ]


def test_health_liveness_probe(client: TestClient):
    """Verifies that /health/liveness returns HTTP 200 alive."""
    resp = client.get("/health/liveness")
    assert resp.status_code == 200
    assert resp.json() == {"status": "alive"}


def test_health_readiness_probe(client: TestClient):
    """Verifies that /health/readiness returns HTTP 200 ready when DB is connected."""
    resp = client.get("/health/readiness")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"


def test_health_detailed_query(client: TestClient):
    """Verifies that /health?details=true returns full telemetry and environment details."""
    resp = client.get("/health?details=true")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data
    assert data["database"] == "connected"


def test_request_timing_middleware_header(client: TestClient):
    """Verifies that incoming requests receive an X-Response-Time-Ms header."""
    resp = client.get("/")
    assert resp.status_code == 200
    assert "X-Response-Time-Ms" in resp.headers
    duration_ms = float(resp.headers["X-Response-Time-Ms"])
    assert duration_ms >= 0.0


def test_database_health_check_function():
    """Verifies check_database_health() execution."""
    assert check_database_health() is True


@pytest.mark.asyncio
async def test_nasa_telemetry_in_memory_caching(mock_nasa_raw_json):
    """
    Verifies that repeated queries within TTL are served from memory cache
    and do NOT generate duplicate external HTTP requests.
    """
    clear_nasa_cache()

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_nasa_raw_json
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    with patch("httpx.AsyncClient", return_value=mock_client):
        # 1st Call: should hit mock HTTP client
        res1 = await fetch_nasa_power_data(district="dinajpur", use_cache=True)
        assert mock_client.get.call_count == 1
        assert res1["is_cached"] is False

        # 2nd Call with identical parameters: should be served directly from in-memory cache
        res2 = await fetch_nasa_power_data(district="dinajpur", use_cache=True)
        # Call count must still be 1!
        assert mock_client.get.call_count == 1
        assert res2["is_cached"] is True
        assert res2["total_days"] == res1["total_days"]

    clear_nasa_cache()
