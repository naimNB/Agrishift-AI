"""
rotation.py — Crop Rotation API Router
======================================
Exposes documented, explainable endpoints for multi-crop rotation planning
grounded in NASA POWER agroclimatology telemetry and Bangladesh AEZ constraints.
"""

from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional

from app.schemas.rotation import (
    CropRotationRequest,
    CropRotationResponse,
)
from app.services.rotation_service import (
    generate_crop_rotation_recommendations,
    CROPPING_PATTERNS_DATABASE,
)

router = APIRouter()


@router.post(
    "/recommend",
    response_model=CropRotationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Explainable Crop Rotation Recommendations",
)
async def recommend_crop_rotations(payload: CropRotationRequest):
    """
    Evaluates multi-crop rotation viability for a Bangladeshi farm:
    - Integrates live historical NASA POWER observations (temperature, precipitation, root-zone wetness)
    - Enforces hard irrigation feasibility gating (rejects Boro rice under rainfed conditions)
    - Validates soil texture suitability and turnaround margins (<365 days)
    - Provides bilingual (Bangla & English) agronomic reasoning and soil-health benefits
    """
    try:
        response = await generate_crop_rotation_recommendations(payload)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate crop rotation recommendations: {str(e)}",
        )


@router.get(
    "/patterns",
    summary="List Scientifically Documented Cropping Patterns",
)
def list_supported_cropping_patterns():
    """
    Returns the repository of verified Bangladesh cropping patterns from
    BARC, BARI, and BRRI field guidelines.
    """
    return {
        "total_patterns": len(CROPPING_PATTERNS_DATABASE),
        "patterns": CROPPING_PATTERNS_DATABASE,
        "authoritative_sources": [
            "Bangladesh Agricultural Research Council (BARC) AEZ Database",
            "Bangladesh Agricultural Research Institute (BARI) Technologies",
            "Bangladesh Rice Research Institute (BRRI) Modern Rice Cultivation",
            "NASA POWER Daily Agroclimatology Project",
        ],
    }
