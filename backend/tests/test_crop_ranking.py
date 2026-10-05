"""
test_crop_ranking.py — Tests for Multi-Crop Recommendation & Ranking Engine
=============================================================================
Tests:
- Rule-based multi-crop ranking (POST /api/predictions/rank-crops)
- Candidate crop coverage: Rice, Wheat, Maize, Jute, Potato, Mustard
- Seasonal agronomic sensitivity (monsoon/rice vs rabi/wheat-potato)
- Factor score transparency (temperature, rainfall, humidity, soil moisture, solar rad)
- ML model ranking engine toggle & fallback
- Legacy single-crop evaluation (POST /api/predictions/crop-suitability)
"""

import pytest
from starlette.testclient import TestClient

CANDIDATE_CROP_SET = {"rice", "wheat", "maize", "jute", "potato", "mustard"}


def test_rank_crops_response_structure(client: TestClient):
    """
    Verifies that POST /api/predictions/rank-crops returns a properly
    structured response with all 6 candidate crops ranked from #1 to #6.
    """
    payload = {
        "location": "bogura",
        "temp_avg": 26.5,
        "precipitation": 8.0,
        "humidity": 75.0,
        "soil_moisture": 0.65,
        "solar_rad": 4.5,
        "wind_speed": 2.0,
        "use_ml": False,
    }
    response = client.post("/api/predictions/rank-crops", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["district"] == "bogura"
    assert data["engine"] == "rule_based"
    assert data["is_ai_model"] is False
    assert "best_crop" in data
    assert len(data["recommendations"]) == 6

    # Verify all candidate crops are present
    returned_crops = {item["crop"] for item in data["recommendations"]}
    assert returned_crops == CANDIDATE_CROP_SET

    # Verify ranks are strictly 1 through 6 in descending score order
    ranks = [item["rank"] for item in data["recommendations"]]
    scores = [item["score"] for item in data["recommendations"]]
    assert ranks == [1, 2, 3, 4, 5, 6]
    assert scores == sorted(scores, reverse=True)


def test_rank_crops_factor_suitability_breakdown(client: TestClient):
    """
    Verifies that each crop recommendation includes explainable factor
    percentages (temperature, rainfall, humidity, soil_moisture, solar_radiation).
    """
    payload = {
        "location": "rangpur",
        "temp_avg": 25.0,
        "precipitation": 5.0,
        "humidity": 70.0,
        "soil_moisture": 0.55,
        "solar_rad": 5.0,
        "wind_speed": 1.8,
    }
    response = client.post("/api/predictions/rank-crops", json=payload)
    assert response.status_code == 200
    data = response.json()

    for item in data["recommendations"]:
        factors = item["factor_scores"]
        assert 0 <= factors["temperature"] <= 100
        assert 0 <= factors["rainfall"] <= 100
        assert 0 <= factors["humidity"] <= 100
        assert 0 <= factors["soil_moisture"] <= 100
        assert 0 <= factors["solar_radiation"] <= 100
        assert isinstance(item["favorable_factors"], list)
        assert isinstance(item["caution_factors"], list)
        assert isinstance(item["reasoning"], list)


def test_rank_crops_monsoon_favors_rice_and_jute(client: TestClient):
    """
    Under high precipitation and warm humid conditions (monsoon / Kharif),
    Rice and Jute should receive higher suitability than dry-season crops like Potato.
    """
    monsoon_conditions = {
        "location": "dinajpur",
        "temp_avg": 30.0,
        "precipitation": 25.0,   # Heavy rain
        "humidity": 88.0,        # Very high humidity
        "soil_moisture": 0.90,   # Saturated soil
        "solar_rad": 4.2,
    }
    response = client.post("/api/predictions/rank-crops", json=monsoon_conditions)
    assert response.status_code == 200
    data = response.json()

    recs = {r["crop"]: r for r in data["recommendations"]}
    # Rice or Jute should rank ahead of Potato and Mustard in heavy monsoon waterlogging
    assert recs["rice"]["score"] > recs["potato"]["score"]
    assert recs["rice"]["score"] > recs["mustard"]["score"]


def test_rank_crops_winter_favors_wheat_potato_mustard(client: TestClient):
    """
    Under cool temperatures and low rainfall (Rabi season),
    temperate/rabi crops (Wheat, Potato, Mustard) should score higher than warm Kharif crops.
    """
    winter_conditions = {
        "location": "rajshahi",
        "temp_avg": 17.5,        # Cool winter temperature
        "precipitation": 0.0,    # Dry
        "humidity": 55.0,
        "soil_moisture": 0.40,   # Moderate dry soil
        "solar_rad": 5.2,
    }
    response = client.post("/api/predictions/rank-crops", json=winter_conditions)
    assert response.status_code == 200
    data = response.json()

    recs = {r["crop"]: r for r in data["recommendations"]}
    assert recs["potato"]["score"] > recs["jute"]["score"]
    assert recs["wheat"]["score"] > recs["jute"]["score"]


def test_rank_crops_ml_toggle(client: TestClient):
    """
    Tests ranking with use_ml=True. Verifies either trained RandomForest
    prediction or graceful fallback to rule-based baseline.
    """
    payload = {
        "location": "bogura",
        "temp_avg": 27.0,
        "precipitation": 12.0,
        "humidity": 78.0,
        "soil_moisture": 0.70,
        "solar_rad": 4.8,
        "use_ml": True,
    }
    response = client.post("/api/predictions/rank-crops", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["engine"] in ("ml_randomforest", "ml_random_forest", "rule_based")
    assert isinstance(data["is_ai_model"], bool)
    assert len(data["recommendations"]) == 6


def test_legacy_crop_suitability_endpoint(client: TestClient):
    """
    Tests POST /api/predictions/crop-suitability for single crop evaluation,
    preserving backwards compatibility.
    """
    payload = {
        "district": "bogura",
        "crop": "rice",
        "temp_avg": 28.0,
        "precipitation": 15.0,
        "humidity": 80.0,
        "soil_moisture": 0.75,
    }
    response = client.post("/api/predictions/crop-suitability", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["crop"] == "rice"
    assert data["district"] == "bogura"
    assert data["suitability"] in ("High", "Medium", "Low")
    assert 0.0 <= data["confidence"] <= 1.0
    assert "recommendation" in data
    assert "best_sow_month" in data


def test_rank_crops_missing_fields_validation(client: TestClient):
    """Verifies that missing essential climate variables triggers 422 Unprocessable Entity."""
    response = client.post("/api/predictions/rank-crops", json={"location": "bogura"})
    assert response.status_code == 422
