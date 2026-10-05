"""
advisory.py — Farmer Advisory API Router
========================================
Serves actionable, explainable farmer advisories across:
- Irrigation
- Crop Selection
- Heat Protection
- Excess Rainfall / Flood Preparation
- Sowing Timing
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.services.advisory_service import generate_farmer_advisories_for_district

router = APIRouter()


class AdvisoryItem(BaseModel):
    category:        str = Field(..., description="Category: irrigation, crop_selection, heat_protection, excess_rainfall, sowing_timing")
    title:           str = Field(..., description="Advisory title in English")
    title_bn:        str = Field(..., description="Advisory title in Bangla")
    message:         str = Field(..., description="Actionable advisory statement in English")
    message_bn:      str = Field(..., description="Actionable advisory statement in Bangla")
    priority:        str = Field(..., description="Priority tier: urgent, actionable, routine")
    icon:            str = Field(..., description="Semantic icon key")
    context_metrics: Dict[str, Any] = Field(..., description="Observational variables justifying this recommendation")


class FarmerAdvisoryResponse(BaseModel):
    district:                 str
    display_name:             str
    assessment_date:          str
    season_context:           str
    engine:                   str
    engine_name:              str
    is_ai_model:              bool
    advisories:               List[AdvisoryItem]
    top_recommended_crop:     Dict[str, Any]
    regional_climate_summary: Dict[str, Any]


@router.get("", response_model=FarmerAdvisoryResponse)
@router.get("/farmer", response_model=FarmerAdvisoryResponse)
async def get_farmer_advisories(
    district: str = Query("bogura", description="District (bogura, rangpur, dinajpur, rajshahi, sylhet)"),
    crop:     Optional[str] = Query(None, description="Optional target crop filter"),
):
    """
    Returns unified, actionable agronomic advisories for local farmers.
    Grounds guidance in live NASA POWER telemetry, multi-crop rankings,
    and climate risk intelligence. Fully bilingual (EN / BN).
    """
    try:
        res = await generate_farmer_advisories_for_district(
            district=district,
            crop=crop,
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate farmer advisory for {district}: {str(e)}"
        )
