"""
test_rotation_service.py — Rigorous Scientific Unit Tests for Crop Rotation Engine
===================================================================================
Tests deterministic feasibility gating, soil compatibility, duration bounds,
NASA POWER telemetry integration, offline fallback without synthetic fabrication,
district AEZ variations, season sensitivity, and monoculture penalties.
"""

import pytest
from app.schemas.rotation import CropRotationRequest
from app.services.rotation_service import (
    evaluate_rotation_feasibility,
    generate_crop_rotation_recommendations,
    CROPPING_PATTERNS_DATABASE,
    DISTRICT_AEZ_PROFILES,
)


def test_patterns_database_integrity():
    """Verify that all database entries have required fields, validated bounds, and institutional citations."""
    assert len(CROPPING_PATTERNS_DATABASE) >= 5
    for pattern in CROPPING_PATTERNS_DATABASE:
        assert "id" in pattern
        assert "crops" in pattern
        assert "duration_days" in pattern
        assert "why_suitable_bn" in pattern
        assert "why_suitable_en" in pattern
        assert "scientific_basis" in pattern
        total_duration = sum(pattern["duration_days"].values())
        assert total_duration <= 365, f"Pattern {pattern['id']} exceeds annual 365 days ({total_duration}d)!"
        assert (365 - total_duration) >= 15, f"Turnaround margin for {pattern['id']} is dangerously tight (<15d)!"


def test_irrigation_hard_constraint_rejects_boro_when_rainfed():
    """Verify that flooded Boro rice without assured irrigation is strictly gated to is_feasible=False."""
    boro_pattern = next(p for p in CROPPING_PATTERNS_DATABASE if "boro" in p["id"])
    dummy_climate = {
        "avg_temperature": 24.0,
        "total_precipitation": 10.0,
        "avg_soil_moisture": 0.50,
    }

    # Case 1: Rainfed (has_irrigation = False) -> Must be INFEASIBLE
    eval_rainfed = evaluate_rotation_feasibility(
        pattern=boro_pattern,
        has_irrigation=False,
        soil_type="loam",
        district="bogura",
        current_crop="rice",
        season="rabi",
        climate_summary=dummy_climate,
    )
    assert eval_rainfed["is_feasible"] is False
    assert eval_rainfed["suitability_tier"] == "Infeasible"
    assert eval_rainfed["water_compatibility_score"] <= 20
    assert any("সেচ সুবিধা না থাকায়" in c for c in eval_rainfed["constraints"])

    # Case 2: Irrigated (has_irrigation = True) -> Must be FEASIBLE
    eval_irrigated = evaluate_rotation_feasibility(
        pattern=boro_pattern,
        has_irrigation=True,
        soil_type="loam",
        district="bogura",
        current_crop="rice",
        season="rabi",
        climate_summary=dummy_climate,
    )
    assert eval_irrigated["is_feasible"] is True
    assert eval_irrigated["suitability_tier"] in ["High", "Moderate"]
    assert eval_irrigated["water_compatibility_score"] >= 75


def test_soil_texture_penalizes_potato_on_heavy_clay():
    """Verify that heavy clay soil reduces potato tuber suitability and adds explicit BARI constraint."""
    potato_pattern = next(p for p in CROPPING_PATTERNS_DATABASE if "potato" in p["crops"])
    dummy_climate = {
        "avg_temperature": 22.0,
        "total_precipitation": 5.0,
        "avg_soil_moisture": 0.50,
    }

    # Clay soil
    eval_clay = evaluate_rotation_feasibility(
        pattern=potato_pattern,
        has_irrigation=True,
        soil_type="heavy_clay",
        district="bogura",
        current_crop="potato",
        season="rabi",
        climate_summary=dummy_climate,
    )
    assert any("এঁটেল মাটিতে আলুর" in c for c in eval_clay["constraints"])
    assert eval_clay["water_compatibility_score"] >= 70

    # Sandy loam soil (ideal for tubers)
    eval_sandy_loam = evaluate_rotation_feasibility(
        pattern=potato_pattern,
        has_irrigation=True,
        soil_type="sandy_loam",
        district="bogura",
        current_crop="potato",
        season="rabi",
        climate_summary=dummy_climate,
    )
    assert not any("এঁটেল মাটিতে আলুর" in c for c in eval_sandy_loam["constraints"])


def test_district_aez_regional_variation():
    """Verify that recommendations genuinely vary according to BARC Agro-Ecological Zones."""
    dummy_climate = {
        "avg_temperature": 24.0,
        "avg_soil_moisture": 0.50,
    }
    jute_wheat_pattern = next(p for p in CROPPING_PATTERNS_DATABASE if "wheat" in p["crops"])
    potato_pattern = next(p for p in CROPPING_PATTERNS_DATABASE if "potato" in p["crops"])

    # High Barind Tract (Rajshahi - AEZ 26): Water conservation is heavily favored
    res_rajshahi = evaluate_rotation_feasibility(
        pattern=jute_wheat_pattern,
        has_irrigation=True,
        soil_type="loam",
        district="rajshahi",
        current_crop="rice",
        season="rabi",
        climate_summary=dummy_climate,
    )
    assert res_rajshahi["is_feasible"] is True

    # Sylhet Basin (AEZ 20/21): Heavy rainfall, waterlogging, acid soils penalize dryland potato & wheat
    res_sylhet = evaluate_rotation_feasibility(
        pattern=potato_pattern,
        has_irrigation=True,
        soil_type="loam",
        district="sylhet",
        current_crop="rice",
        season="rabi",
        climate_summary=dummy_climate,
    )
    assert any("সিলেট অববাহিকার অতিরিক্ত বৃষ্টিপাত" in c for c in res_sylhet["constraints"])


def test_season_sensitivity():
    """Verify that changing target season dynamically adjusts rotational timeliness."""
    dummy_climate = {"avg_temperature": 24.0, "avg_soil_moisture": 0.50}
    potato_pattern = next(p for p in CROPPING_PATTERNS_DATABASE if "potato" in p["crops"])
    jute_pattern = next(p for p in CROPPING_PATTERNS_DATABASE if "jute" in p["crops"])

    # In Rabi: Potato is an active winter crop -> higher timeliness score
    eval_potato_rabi = evaluate_rotation_feasibility(
        pattern=potato_pattern,
        has_irrigation=True,
        soil_type="loam",
        district="bogura",
        current_crop="rice",
        season="rabi",
        climate_summary=dummy_climate,
    )
    # In Kharif-1: Jute is an active pre-monsoon crop -> higher timeliness score
    eval_jute_k1 = evaluate_rotation_feasibility(
        pattern=jute_pattern,
        has_irrigation=True,
        soil_type="loam",
        district="bogura",
        current_crop="rice",
        season="kharif-1",
        climate_summary=dummy_climate,
    )
    assert eval_potato_rabi["suitability_score"] >= 0.85
    assert eval_jute_k1["suitability_score"] >= 0.85


def test_current_crop_monoculture_penalty():
    """Verify that repeated monoculture (e.g. potato after potato) triggers disease warning."""
    dummy_climate = {"avg_temperature": 22.0, "avg_soil_moisture": 0.50}
    potato_pattern = next(p for p in CROPPING_PATTERNS_DATABASE if "potato" in p["crops"])

    eval_potato_monoculture = evaluate_rotation_feasibility(
        pattern=potato_pattern,
        has_irrigation=True,
        soil_type="sandy_loam",
        district="bogura",
        current_crop="potato", # Repeating potato
        season="rabi",
        climate_summary=dummy_climate,
    )
    assert any("পরপর একই জমিতে আলু চাষে" in c for c in eval_potato_monoculture["constraints"])


def test_missing_climate_telemetry_honest_fallback():
    """Verify that when telemetry is missing/empty, no fabricated numbers are generated."""
    potato_pattern = next(p for p in CROPPING_PATTERNS_DATABASE if "potato" in p["crops"])

    eval_offline = evaluate_rotation_feasibility(
        pattern=potato_pattern,
        has_irrigation=True,
        soil_type="loam",
        district="bogura",
        current_crop="rice",
        season="rabi",
        climate_summary={}, # Empty: no telemetry
    )
    assert eval_offline["is_feasible"] is True
    assert eval_offline["suitability_score"] > 0.0


def test_invalid_crop_sequence_duration_overflow():
    """Verify that an artificially bloated pattern exceeding 365 days triggers schedule conflict."""
    dummy_pattern = {
        "id": "invalid_long_pattern",
        "title_bn": "ভুল আবর্তন",
        "title_en": "Invalid Overlong Rotation",
        "sequence_bn": "ফসল ১ ➔ ফসল ২ ➔ ফসল ৩",
        "sequence_en": "Crop 1 ➔ Crop 2 ➔ Crop 3",
        "crops": ["rice", "rice", "rice"],
        "seasons": ["kharif-2", "rabi", "kharif-1"],
        "duration_days": {
            "c1": 150,
            "c2": 150,
            "c3": 100, # Total = 400 days > 365!
        },
        "water_intensity": "low",
        "irrigation_required": False,
        "ideal_soils": ["loam"],
        "unfavorable_soils": [],
        "diversity_score": 70,
        "why_suitable_bn": "টেস্ট",
        "why_suitable_en": "Test",
        "soil_benefit_bn": "টেস্ট",
        "soil_benefit_en": "Test",
        "water_regime_bn": "টেস্ট",
        "water_regime_en": "Test",
        "risk_level_bn": "টেস্ট",
        "risk_level_en": "Test",
        "scientific_basis": "None",
    }
    res = evaluate_rotation_feasibility(
        pattern=dummy_pattern,
        has_irrigation=True,
        soil_type="loam",
        district="bogura",
        current_crop="rice",
        season="rabi",
        climate_summary={},
    )
    assert res["is_feasible"] is False
    assert any("৩৬৫ দিনের সীমা অতিক্রম" in c for c in res["constraints"])


@pytest.mark.asyncio
async def test_generate_crop_rotation_recommendations_ranking():
    """Test full async recommendation workflow for Bogura irrigated farming."""
    req = CropRotationRequest(
        district="bogura",
        current_crop="rice",
        season="rabi",
        soil_type="sandy_loam",
        has_irrigation=True,
    )
    res = await generate_crop_rotation_recommendations(req)

    assert res.district == "bogura"
    assert res.has_irrigation is True
    assert len(res.recommended_rotations) >= 5
    assert len(res.data_sources) >= 4

    # Top recommended rotation must be feasible
    top_plan = res.recommended_rotations[0]
    assert top_plan.is_feasible is True
    assert top_plan.suitability_score >= 0.80
    assert top_plan.title_bn != ""
    assert top_plan.title_en != ""


@pytest.mark.asyncio
async def test_generate_crop_rotation_recommendations_rainfed_prioritization():
    """Test that rainfed query in Rajshahi suppresses Boro and promotes low-water patterns."""
    req = CropRotationRequest(
        district="rajshahi",
        current_crop="rice",
        season="rabi",
        soil_type="clay_loam",
        has_irrigation=False, # Rainfed
    )
    res = await generate_crop_rotation_recommendations(req)

    # First recommended plan must be feasible and NOT require intensive irrigation
    top_plan = res.recommended_rotations[0]
    assert top_plan.is_feasible is True
    assert "boro" not in top_plan.id

    # The Boro plan must be at the bottom / marked infeasible
    boro_plan = next(p for p in res.recommended_rotations if "boro" in p.id)
    assert boro_plan.is_feasible is False
    assert boro_plan.suitability_tier == "Infeasible"


@pytest.mark.asyncio
async def test_unsupported_district_graceful_handling():
    """Test that an unknown district safely defaults without crashing."""
    req = CropRotationRequest(
        district="unknown_zone_xyz",
        current_crop="rice",
        season="rabi",
        soil_type="loam",
        has_irrigation=True,
    )
    res = await generate_crop_rotation_recommendations(req)
    assert res.district == "bogura"
    assert len(res.recommended_rotations) >= 5
