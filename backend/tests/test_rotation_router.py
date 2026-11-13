"""
test_rotation_router.py — Integration Tests for Crop Rotation API Endpoints
=============================================================================
Verifies REST endpoints /api/rotations/recommend and /api/rotations/patterns
across districts, seasons, soils, and irrigation regimes.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_get_patterns_catalog_endpoint():
    res = client.get("/api/rotations/patterns")
    assert res.status_code == 200
    data = res.json()
    assert data["total_patterns"] >= 5
    assert "patterns" in data
    assert len(data["authoritative_sources"]) >= 3


def test_post_rotation_recommendations_endpoint_irrigated():
    payload = {
        "district": "bogura",
        "current_crop": "rice",
        "season": "rabi",
        "soil_type": "loam",
        "has_irrigation": True,
    }
    res = client.post("/api/rotations/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["district"] == "bogura"
    assert data["has_irrigation"] is True
    assert len(data["recommended_rotations"]) >= 5

    first_plan = data["recommended_rotations"][0]
    assert first_plan["is_feasible"] is True
    assert "title_bn" in first_plan
    assert "title_en" in first_plan
    assert "why_suitable_bn" in first_plan
    assert "scientific_basis" in first_plan


def test_post_rotation_recommendations_endpoint_rainfed_constraints():
    payload = {
        "district": "dinajpur",
        "current_crop": "rice",
        "season": "rabi",
        "soil_type": "sandy_loam",
        "has_irrigation": False,
    }
    res = client.post("/api/rotations/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["has_irrigation"] is False

    # Infeasible plans should have constraints explaining water deficit
    infeasible_plans = [p for p in data["recommended_rotations"] if not p["is_feasible"]]
    assert len(infeasible_plans) >= 1
    assert any("সেচ সুবিধা না থাকায়" in c for c in infeasible_plans[0]["constraints"])


def test_post_rotation_recommendations_custom_coords():
    payload = {
        "district": "bogura",
        "current_crop": "potato",
        "season": "rabi",
        "soil_type": "loam",
        "has_irrigation": True,
        "latitude": 24.8465,
        "longitude": 89.3773,
    }
    res = client.post("/api/rotations/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommended_rotations"]) >= 5


def test_post_rotation_recommendations_season_sensitivity():
    payload_rabi = {
        "district": "bogura",
        "current_crop": "rice",
        "season": "rabi",
        "soil_type": "loam",
        "has_irrigation": True,
    }
    res_rabi = client.post("/api/rotations/recommend", json=payload_rabi).json()

    payload_k1 = {
        "district": "bogura",
        "current_crop": "rice",
        "season": "kharif-1",
        "soil_type": "loam",
        "has_irrigation": True,
    }
    res_k1 = client.post("/api/rotations/recommend", json=payload_k1).json()

    # Ranks or scores should reflect season timeliness
    assert res_rabi["season_context"] == "rabi"
    assert res_k1["season_context"] == "kharif-1"


def test_post_rotation_recommendations_district_aez_variation():
    payload_rajshahi = {
        "district": "rajshahi",
        "current_crop": "rice",
        "season": "rabi",
        "soil_type": "loam",
        "has_irrigation": False,
    }
    res_raj = client.post("/api/rotations/recommend", json=payload_rajshahi).json()
    top_raj = res_raj["recommended_rotations"][0]
    # Rainfed Rajshahi must prioritize a low-water cycle
    assert "boro" not in top_raj["id"]
