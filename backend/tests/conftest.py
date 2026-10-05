"""
conftest.py — Pytest Configuration and Global Fixtures
======================================================
Sets up in-memory SQLite database, FastAPI TestClient, and
mock external NASA POWER API responses so no external requests are made.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.database import Base, get_db
from main import app


@pytest.fixture(scope="session")
def test_engine():
    """Isolated in-memory SQLite database for test execution."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_engine):
    """Provides a transactional database session rolled back after every test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_nasa_raw_json():
    """
    Simulated raw NASA POWER Agroclimatology JSON response.
    Includes normal readings and a -999.0 sentinel observation
    to verify parsing and cleaning logic.
    """
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [89.3773, 24.8465, 20.0]
        },
        "properties": {
            "parameter": {
                "T2M": {
                    "20260101": 22.5,
                    "20260102": 24.0,
                    "20260103": -999.0,  # Missing observation to test -999 cleaning
                },
                "T2M_MAX": {
                    "20260101": 28.5,
                    "20260102": 31.0,
                    "20260103": 29.5,
                },
                "T2M_MIN": {
                    "20260101": 16.0,
                    "20260102": 17.5,
                    "20260103": 15.0,
                },
                "PRECTOTCORR": {
                    "20260101": 2.5,
                    "20260102": 0.0,
                    "20260103": 5.0,
                },
                "RH2M": {
                    "20260101": 72.0,
                    "20260102": 68.0,
                    "20260103": 75.0,
                },
                "ALLSKY_SFC_SW_DWN": {
                    "20260101": 4.5,
                    "20260102": 4.8,
                    "20260103": 4.2,
                },
                "WS2M": {
                    "20260101": 2.1,
                    "20260102": 2.5,
                    "20260103": 1.8,
                },
                "GWETROOT": {
                    "20260101": 0.65,
                    "20260102": 0.62,
                    "20260103": 0.60,
                },
            }
        },
        "header": {
            "title": "NASA POWER Daily Agroclimatology",
            "api_version": "v2.0.0"
        }
    }


@pytest.fixture
def mock_nasa_parsed_dataset():
    """
    Standard pre-cleaned NASA dataset structure matching fetch_nasa_power_data output,
    used to mock external telemetry in service and router tests.
    """
    return {
        "district": "bogura",
        "display_name": "Bogura",
        "latitude": 24.8465,
        "longitude": 89.3773,
        "is_custom_coords": False,
        "nearest_district": "Bogura",
        "start_date": "2026-01-01",
        "end_date": "2026-01-03",
        "total_days": 3,
        "source": "NASA POWER Daily Agroclimatology (Mocked Test Dataset)",
        "data": [
            {
                "date": "2026-01-01",
                "temp_avg": 22.5,
                "temp_max": 28.5,
                "temp_min": 16.0,
                "precipitation": 2.5,
                "humidity": 72.0,
                "solar_rad": 4.5,
                "wind_speed": 2.1,
                "soil_moisture": 0.65,
            },
            {
                "date": "2026-01-02",
                "temp_avg": 24.0,
                "temp_max": 31.0,
                "temp_min": 17.5,
                "precipitation": 0.0,
                "humidity": 68.0,
                "solar_rad": 4.8,
                "wind_speed": 2.5,
                "soil_moisture": 0.62,
            },
            {
                "date": "2026-01-03",
                "temp_avg": None,  # Cleaned missing value
                "temp_max": 29.5,
                "temp_min": 15.0,
                "precipitation": 5.0,
                "humidity": 75.0,
                "solar_rad": 4.2,
                "wind_speed": 1.8,
                "soil_moisture": 0.60,
            },
        ]
    }
