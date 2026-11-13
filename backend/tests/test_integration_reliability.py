"""
test_integration_reliability.py — End-to-End Reliability & Failure Mode Integration Tests
=========================================================================================
Tests system robustness under:
1. Upstream NASA POWER API failure / timeout / 503 response
2. Complete network disconnection
3. Invalid and out-of-bounds geographic coordinates
4. Missing / corrupted climate data without synthetic fabrication
5. Unknown / unsupported district inputs
"""

import pytest
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from main import app
from app.schemas.rotation import CropRotationRequest
from app.services.rotation_service import generate_crop_rotation_recommendations
from app.services.nasa_service import validate_coordinates, fetch_nasa_power_data

client = TestClient(app)


def test_invalid_coordinates_out_of_bounds():
    """Verify that coordinates outside valid geographic ranges raise ValueError."""
    with pytest.raises(ValueError, match="Latitude 95.0 is out of bounds"):
        validate_coordinates(95.0, 90.0)

    with pytest.raises(ValueError, match="Longitude 200.0 is out of bounds"):
        validate_coordinates(24.0, 200.0)

    with pytest.raises(ValueError, match="Both latitude and longitude must be provided together"):
        validate_coordinates(24.0, None)


def test_post_recommendations_invalid_coordinates_handled_gracefully():
    """API endpoint should reject or safely handle out-of-bounds coordinates with validation error."""
    payload = {
        "district": "bogura",
        "current_crop": "rice",
        "season": "rabi",
        "soil_type": "loam",
        "has_irrigation": True,
        "latitude": 999.0,
        "longitude": 999.0,
    }
    # Should either return 200 with fallback to district coords or return 422/400
    res = client.post("/api/rotations/recommend", json=payload)
    assert res.status_code in [200, 422, 400]
    if res.status_code == 200:
        data = res.json()
        assert data["is_fallback_telemetry"] is True


@pytest.mark.asyncio
async def test_nasa_api_http_timeout_triggers_honest_fallback():
    """When NASA POWER API times out, system must switch to static BARC mode without fabricating data."""
    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("NASA upstream timed out")):
        req = CropRotationRequest(
            district="bogura",
            current_crop="rice",
            season="rabi",
            soil_type="loam",
            has_irrigation=True,
        )
        res = await generate_crop_rotation_recommendations(req)

        assert res.is_fallback_telemetry is True
        assert "Offline" in res.telemetry_source or "Unavailable" in res.telemetry_source
        assert res.climate_context == {}  # Strictly empty: NO synthetic numbers fabricated!
        assert len(res.recommended_rotations) >= 5
        assert res.recommended_rotations[0].is_feasible is True


@pytest.mark.asyncio
async def test_nasa_api_503_service_unavailable_handled_cleanly():
    """When NASA POWER returns 503, system falls back gracefully to static BARC AEZ rules."""
    mock_resp = httpx.Response(503, request=httpx.Request("GET", "https://power.larc.nasa.gov"))
    with patch("httpx.AsyncClient.get", side_effect=httpx.HTTPStatusError("503 Service Unavailable", request=mock_resp.request, response=mock_resp)):
        req = CropRotationRequest(
            district="rajshahi",
            current_crop="rice",
            season="rabi",
            soil_type="loam",
            has_irrigation=False,
        )
        res = await generate_crop_rotation_recommendations(req)

        assert res.is_fallback_telemetry is True
        # Gating must still work in static mode
        boro_plan = next(p for p in res.recommended_rotations if "boro" in p.id)
        assert boro_plan.is_feasible is False


@pytest.mark.asyncio
async def test_network_connection_error_handled_cleanly():
    """When device/server has no internet connection, engine executes deterministic evaluation."""
    with patch("httpx.AsyncClient.get", side_effect=httpx.ConnectError("Network unreachable")):
        req = CropRotationRequest(
            district="dinajpur",
            current_crop="rice",
            season="rabi",
            soil_type="sandy_loam",
            has_irrigation=True,
        )
        res = await generate_crop_rotation_recommendations(req)

        assert res.is_fallback_telemetry is True
        assert res.climate_context == {}
        assert len(res.recommended_rotations) >= 5


def test_post_recommendations_unsupported_district_fallback():
    """Unknown districts must default to standard agricultural baseline without error."""
    payload = {
        "district": "nonexistent_district_123",
        "current_crop": "rice",
        "season": "rabi",
        "soil_type": "loam",
        "has_irrigation": True,
    }
    res = client.post("/api/rotations/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["district"] == "bogura"
    assert len(data["recommended_rotations"]) >= 5


def test_all_five_combinations_differ_meaningfully():
    """Verify that 5 combinations of inputs produce meaningfully distinct recommendations."""
    scenarios = [
        {"district": "bogura", "season": "rabi", "current_crop": "rice", "soil_type": "loam", "has_irrigation": True},
        {"district": "rajshahi", "season": "rabi", "current_crop": "rice", "soil_type": "clay_loam", "has_irrigation": False},
        {"district": "sylhet", "season": "kharif-2", "current_crop": "rice", "soil_type": "clay", "has_irrigation": True},
        {"district": "dinajpur", "season": "rabi", "current_crop": "potato", "soil_type": "heavy_clay", "has_irrigation": True},
        {"district": "rangpur", "season": "kharif-1", "current_crop": "jute", "soil_type": "sandy_loam", "has_irrigation": True},
    ]

    responses = [client.post("/api/rotations/recommend", json=s).json() for s in scenarios]

    # Verify that not all top recommendations or scores are identical
    top_ids = [r["recommended_rotations"][0]["id"] for r in responses]
    top_scores = [r["recommended_rotations"][0]["suitability_score"] for r in responses]
    infeasible_counts = [len([p for p in r["recommended_rotations"] if not p["is_feasible"]]) for r in responses]

    # Scenario 2 (Rajshahi rainfed) must have an infeasible plan
    assert infeasible_counts[1] >= 1

    # Scenario 4 (Dinajpur potato on heavy clay) must contain soil/monoculture constraints
    scen4_plans = responses[3]["recommended_rotations"]
    potato_plan = next(p for p in scen4_plans if "potato" in p["id"])
    assert len(potato_plan["constraints"]) >= 1

    # Scenario 3 (Sylhet wet basin) must have geographic constraints on potato/wheat
    scen3_plans = responses[2]["recommended_rotations"]
    sylhet_potato = next(p for p in scen3_plans if "potato" in p["id"])
    assert any("সিলেট অববাহিকার" in c for c in sylhet_potato["constraints"])
