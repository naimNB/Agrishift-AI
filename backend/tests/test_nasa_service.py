"""
test_nasa_service.py — NASA POWER API Telemetry Service Unit Tests
===================================================================
Tests NASA service coordinate validation, nearest-district calculation,
data parsing, and summary statistics.

CRITICAL REQUIREMENT:
All external network calls to NASA POWER API are completely mocked.
No real external HTTP requests are made.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import date

from app.services.nasa_service import (
    validate_coordinates,
    find_nearest_district,
    fetch_nasa_power_data,
    get_summary_stats,
    DISTRICT_COORDS,
)


def test_validate_coordinates_valid():
    """Tests that valid latitude and longitude within geographical bounds pass."""
    lat, lon = validate_coordinates(24.8465, 89.3773)
    assert lat == 24.8465
    assert lon == 89.3773


def test_validate_coordinates_none():
    """Tests that passing None for both lat and lon returns None, None."""
    lat, lon = validate_coordinates(None, None)
    assert lat is None
    assert lon is None


def test_validate_coordinates_single_none():
    """Tests that providing only one coordinate raises ValueError."""
    with pytest.raises(ValueError, match="Both latitude and longitude must be provided together"):
        validate_coordinates(24.8465, None)

    with pytest.raises(ValueError, match="Both latitude and longitude must be provided together"):
        validate_coordinates(None, 89.3773)


def test_validate_coordinates_out_of_bounds():
    """Tests that coordinates outside valid geographic ranges raise ValueError."""
    with pytest.raises(ValueError, match="Latitude 95.0 is out of bounds"):
        validate_coordinates(95.0, 89.3773)

    with pytest.raises(ValueError, match="Latitude -91.0 is out of bounds"):
        validate_coordinates(-91.0, 89.3773)

    with pytest.raises(ValueError, match="Longitude 190.0 is out of bounds"):
        validate_coordinates(24.8465, 190.0)

    with pytest.raises(ValueError, match="Longitude -185.0 is out of bounds"):
        validate_coordinates(24.8465, -185.0)


def test_validate_coordinates_invalid_type():
    """Tests that non-numeric coordinates raise ValueError."""
    with pytest.raises(ValueError, match="Invalid coordinate format"):
        validate_coordinates("invalid_lat", 89.3773)


def test_find_nearest_district():
    """Verifies nearest district distance and identification."""
    # Exact coordinates for Bogura
    dist, km = find_nearest_district(24.8465, 89.3773)
    assert dist == "bogura"
    assert km < 1.0

    # Near Rangpur
    dist, km = find_nearest_district(25.75, 89.28)
    assert dist == "rangpur"
    assert km < 5.0

    # Near Sylhet
    dist, km = find_nearest_district(24.90, 91.87)
    assert dist == "sylhet"
    assert km < 5.0


@pytest.mark.asyncio
async def test_fetch_nasa_power_data_mocked(mock_nasa_raw_json):
    """
    Tests fetch_nasa_power_data with a mocked httpx response.
    Verifies that:
    1. No external HTTP request is performed.
    2. Missing values (-999.0) are cleaned and transformed to None.
    3. Proper date formatting (YYYY-MM-DD) is applied.
    4. Records array is populated accurately.
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_nasa_raw_json
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await fetch_nasa_power_data(district="bogura")

    assert mock_client.get.called
    assert result["district"] == "bogura"
    assert result["display_name"] == "Bogura"
    assert result["total_days"] == 3
    assert len(result["data"]) == 3

    # Check Day 1 (standard values)
    day1 = result["data"][0]
    assert day1["date"] == "2026-01-01"
    assert day1["temp_avg"] == 22.5
    assert day1["temp_max"] == 28.5
    assert day1["temp_min"] == 16.0
    assert day1["precipitation"] == 2.5
    assert day1["humidity"] == 72.0
    assert day1["solar_rad"] == 4.5
    assert day1["wind_speed"] == 2.1
    assert day1["soil_moisture"] == 0.65

    # Check Day 3 (-999.0 sentinel missing value must be None)
    day3 = result["data"][2]
    assert day3["date"] == "2026-01-03"
    assert day3["temp_avg"] is None  # -999.0 cleaned to None
    assert day3["temp_max"] == 29.5


@pytest.mark.asyncio
async def test_fetch_nasa_power_data_custom_coordinates(mock_nasa_raw_json):
    """Verifies fetching NASA telemetry for custom geographic coordinates (lat/lon)."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_nasa_raw_json
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await fetch_nasa_power_data(lat=24.8500, lon=89.3800)

    assert result["is_custom_coords"] is True
    assert result["latitude"] == 24.85
    assert result["longitude"] == 89.38
    assert "Point (24.8500°N, 89.3800°E)" in result["display_name"]
    assert result["nearest_district"] == "Bogura"


def test_get_summary_stats():
    """
    Tests get_summary_stats calculations, ensuring None and -999 values
    are excluded from averages and minimum/maximum computations.
    """
    records = [
        {
            "temp_avg": 20.0,
            "temp_max": 28.0,
            "temp_min": 14.0,
            "precipitation": 10.0,
            "humidity": 60.0,
            "solar_rad": 4.0,
            "wind_speed": 2.0,
            "soil_moisture": 0.50,
        },
        {
            "temp_avg": 30.0,
            "temp_max": 34.0,
            "temp_min": 18.0,
            "precipitation": 0.0,
            "humidity": 70.0,
            "solar_rad": 5.0,
            "wind_speed": 3.0,
            "soil_moisture": 0.60,
        },
        {
            "temp_avg": None,   # Excluded from avg
            "temp_max": 30.0,
            "temp_min": None,   # Excluded from min
            "precipitation": -999, # Excluded sentinel
            "humidity": None,
            "solar_rad": 4.5,
            "wind_speed": 2.5,
            "soil_moisture": 0.55,
        }
    ]

    stats = get_summary_stats(records)

    assert stats["avg_temperature"] == 25.0  # (20 + 30) / 2
    assert stats["max_temperature"] == 34.0  # max(28, 34, 30)
    assert stats["min_temperature"] == 14.0  # min(14, 18)
    assert stats["total_precipitation"] == 10.0  # 10 + 0 (ignoring -999)
    assert stats["avg_humidity"] == 65.0    # (60 + 70) / 2
    assert stats["avg_solar_radiation"] == 4.5 # (4.0 + 5.0 + 4.5) / 3
    assert stats["avg_wind_speed"] == 2.5   # (2.0 + 3.0 + 2.5) / 3
    assert stats["avg_soil_moisture"] == 0.55


def test_get_summary_stats_empty():
    """Tests summary stats handling of empty telemetry records."""
    assert get_summary_stats([]) == {}
