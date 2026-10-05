"""
test_advisory.py — Farmer Advisory Engine Unit Tests
=====================================================
Tests explainable, actionable agroclimatic advisory synthesis across:
1. Irrigation management
2. Crop selection
3. Heat protection
4. Excess rainfall & flood preparation
5. Sowing timing

CRITICAL: All external calls to NASA POWER API are mocked.
"""

import pytest
from unittest.mock import patch, AsyncMock
from starlette.testclient import TestClient

from app.services.advisory_service import (
    generate_irrigation_advisory,
    generate_crop_selection_advisory,
    generate_heat_protection_advisory,
    generate_excess_rainfall_advisory,
    generate_sowing_timing_advisory,
)


@pytest.fixture
def mock_nasa_for_advisory(mock_nasa_parsed_dataset):
    """Mocks external NASA data calls in advisory and risk service modules."""
    with patch(
        "app.services.advisory_service.fetch_nasa_power_data",
        new_callable=AsyncMock,
        return_value=mock_nasa_parsed_dataset,
    ), patch(
        "app.services.climate_risk_service.fetch_nasa_power_data",
        new_callable=AsyncMock,
        return_value=mock_nasa_parsed_dataset,
    ):
        yield


def test_farmer_advisory_endpoint_structure(client: TestClient, mock_nasa_for_advisory):
    """
    Tests GET /api/advisory/farmer endpoint structure, verifying that
    actionable advisories are generated across all 5 key agronomic categories.
    """
    response = client.get("/api/advisory/farmer?district=bogura")
    assert response.status_code == 200
    data = response.json()

    assert data["district"] == "bogura"
    assert data["display_name"] == "Bogura"
    assert "top_recommended_crop" in data
    assert "regional_climate_summary" in data
    assert len(data["advisories"]) >= 5

    categories = {adv["category"] for adv in data["advisories"]}
    expected_categories = {
        "irrigation",
        "crop_selection",
        "heat_protection",
        "excess_rainfall",
        "sowing_timing",
    }
    assert expected_categories.issubset(categories)


def test_advisory_bilingual_coverage(client: TestClient, mock_nasa_for_advisory):
    """
    Verifies that every advisory item contains both English and Bangla
    titles and messages without empty strings or placeholders.
    """
    response = client.get("/api/advisory/farmer?district=rangpur")
    assert response.status_code == 200
    data = response.json()

    for item in data["advisories"]:
        assert item["title"] and len(item["title"]) > 3
        assert item["title_bn"] and len(item["title_bn"]) > 3
        assert item["message"] and len(item["message"]) > 10
        assert item["message_bn"] and len(item["message_bn"]) > 10
        assert item["priority"] in ("urgent", "actionable", "routine")
        assert "icon" in item
        assert "context_metrics" in item


def test_irrigation_advisory_adequate_moisture():
    """Verifies that adequate soil moisture produces water-conservation advice."""
    res = generate_irrigation_advisory(
        soil_moisture=0.70,
        precip_recent=15.0,
        drought_risk_level="low",
        temp_avg=26.0,
    )
    assert res["category"] == "irrigation"
    assert res["priority"] == "routine"
    assert "adequate" in res["message"].lower() or "conserve" in res["message"].lower()
    assert "সন্তোষজনক" in res["message_bn"] or "সাশ্রয়" in res["message_bn"]


def test_irrigation_advisory_severe_drought():
    """Verifies that low soil moisture with high drought risk triggers urgent irrigation."""
    res = generate_irrigation_advisory(
        soil_moisture=0.18,
        precip_recent=0.0,
        drought_risk_level="high",
        temp_avg=34.0,
    )
    assert res["priority"] in ("urgent", "actionable")
    assert "সেচ" in res["message_bn"]


def test_heat_protection_advisory_heatwave():
    """Verifies that extreme max temperatures trigger urgent heat-protection mitigation."""
    res = generate_heat_protection_advisory(
        temp_max=41.5,
        temp_avg=33.0,
        heat_risk_level="high",
        humidity=75.0,
    )
    assert res["category"] == "heat_protection"
    assert res["priority"] == "urgent"
    assert "তাপ" in res["message_bn"]


def test_excess_rainfall_advisory_deluge():
    """Verifies that heavy precipitation triggers flood drainage directives."""
    res = generate_excess_rainfall_advisory(
        flood_risk_level="high",
        peak_daily_rain=85.0,
        soil_moisture=0.88,
    )
    assert res["category"] == "excess_rainfall"
    assert res["priority"] == "urgent"
    assert "drainage" in res["message"].lower() or "waterlog" in res["message"].lower() or "precipitation" in res["message"].lower()
    assert "নিষ্কাশন" in res["message_bn"] or "নালা" in res["message_bn"]


def test_crop_selection_advisory_highlights_top_candidate():
    """Verifies that crop selection advisory dynamically highlights the highest scoring crop."""
    best = {"crop": "rice", "display_name": "Rice (ধান)", "score": 0.92, "rank": 1}
    runner_up = {"crop": "wheat", "display_name": "Wheat (গম)", "score": 0.65, "rank": 2}
    res = generate_crop_selection_advisory(best_crop=best, runner_up=runner_up)
    assert res["category"] == "crop_selection"
    assert "Rice" in res["message"] or "rice" in res["message"]
    assert "ধান" in res["message_bn"]

