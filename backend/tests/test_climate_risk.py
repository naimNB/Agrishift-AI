"""
test_climate_risk.py — Climate Risk Intelligence Unit Tests
============================================================
Tests agroclimatic hazard evaluation:
- Drought Risk
- Flood / Excess Rainfall Risk
- Heat Stress Risk
- What-if simulation overrides (temp_max, precipitation, soil_moisture)

CRITICAL: All external calls to NASA POWER API are mocked.
"""

import pytest
from unittest.mock import patch, AsyncMock
from starlette.testclient import TestClient

from app.services.climate_risk_service import (
    assess_climate_risks_for_district,
    evaluate_drought_risk,
    evaluate_flood_risk,
    evaluate_heat_stress_risk,
)


@pytest.fixture
def mock_fetch_nasa(mock_nasa_parsed_dataset):
    """Mocks fetch_nasa_power_data in the climate risk service module."""
    with patch(
        "app.services.climate_risk_service.fetch_nasa_power_data",
        new_callable=AsyncMock,
        return_value=mock_nasa_parsed_dataset,
    ) as mock:
        yield mock


def test_get_climate_risk_endpoint_structure(client: TestClient, mock_fetch_nasa):
    """
    Tests GET /api/risk/climate endpoint response structure,
    verifying evaluation of drought, flood, and heat_stress risks.
    """
    response = client.get("/api/risk/climate?district=bogura")
    assert response.status_code == 200
    data = response.json()

    assert data["district"] == "bogura"
    assert data["display_name"] == "Bogura"
    assert "overall_risk_level" in data
    assert 0.0 <= data["overall_risk_score"] <= 1.0
    assert len(data["risks"]) == 3

    risk_types = {r["risk_type"] for r in data["risks"]}
    assert risk_types == {"drought", "flood", "heat_stress"}

    for item in data["risks"]:
        assert item["level"] in ("low", "moderate", "high")
        assert 0.0 <= item["score"] <= 1.0
        assert 0 <= item["score_percent"] <= 100
        assert len(item["explanation"]) > 10
        assert len(item["recommended_action"]) > 10
        assert "contributing_variables" in item

    # Ensure external mock was utilized, not a real HTTP request
    assert mock_fetch_nasa.called


def test_heat_stress_simulation_high(client: TestClient, mock_fetch_nasa):
    """
    Tests what-if simulation override with extreme heat (43.0°C).
    Verifies that Heat Stress risk jumps to 'high'.
    """
    response = client.get("/api/risk/climate?district=rajshahi&temp_max=43.0")
    assert response.status_code == 200
    data = response.json()

    heat_risk = next(r for r in data["risks"] if r["risk_type"] == "heat_stress")
    assert heat_risk["level"] == "high"
    assert heat_risk["score"] >= 0.70


def test_flood_risk_simulation_high(client: TestClient, mock_fetch_nasa):
    """
    Tests what-if simulation override with heavy rainfall (110.0 mm).
    Verifies that Flood / Excess Rainfall risk jumps to 'high'.
    """
    response = client.get("/api/risk/climate?district=sylhet&precipitation=110.0")
    assert response.status_code == 200
    data = response.json()

    flood_risk = next(r for r in data["risks"] if r["risk_type"] == "flood")
    assert flood_risk["level"] == "high"
    assert flood_risk["score"] >= 0.70


def test_drought_risk_simulation_high(client: TestClient, mock_fetch_nasa):
    """
    Tests what-if simulation override with zero precipitation and severely depleted soil moisture (0.12).
    Verifies that Drought risk escalates to 'high'.
    """
    response = client.get(
        "/api/risk/climate?district=dinajpur&precipitation=0.0&soil_moisture=0.12"
    )
    assert response.status_code == 200
    data = response.json()

    drought_risk = next(r for r in data["risks"] if r["risk_type"] == "drought")
    assert drought_risk["level"] == "high"
    assert drought_risk["score"] >= 0.65


def test_pure_drought_calculation_logic():
    """Unit test for isolated drought calculation function."""
    res_dry = evaluate_drought_risk(
        soil_moisture=0.15,
        total_rain_period=0.0,
        max_dry_spell=14,
        temp_avg=32.0,
        humidity=45.0,
    )
    assert res_dry["level"] == "high"
    assert res_dry["score"] >= 0.70

    res_wet = evaluate_drought_risk(
        soil_moisture=0.75,
        total_rain_period=45.0,
        max_dry_spell=0,
        temp_avg=26.0,
        humidity=80.0,
    )
    assert res_wet["level"] == "low"
    assert res_wet["score"] < 0.35


def test_pure_heat_stress_calculation_logic():
    """Unit test for isolated heat stress calculation function."""
    res_extreme = evaluate_heat_stress_risk(
        temp_max=42.0,
        temp_avg=33.0,
        humidity=85.0,
        solar_rad=6.5,
    )
    assert res_extreme["level"] == "high"
    assert res_extreme["score"] >= 0.70

    res_mild = evaluate_heat_stress_risk(
        temp_max=24.0,
        temp_avg=20.0,
        humidity=60.0,
        solar_rad=4.0,
    )
    assert res_mild["level"] == "low"
    assert res_mild["score"] <= 0.30

