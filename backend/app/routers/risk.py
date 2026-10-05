"""
risk.py — Climate Risk Intelligence Router
==========================================
Endpoint for real-time agroclimatic hazard assessment across:
- Drought Risk
- Flood / Excess Rainfall Risk
- Heat Stress Risk
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date

from app.services.climate_risk_service import assess_climate_risks_for_district

router = APIRouter()


class RiskItem(BaseModel):
    risk_type:              str = Field(..., description="Machine identifier (drought, flood, heat_stress)")
    name:                   str = Field(..., description="Human-readable title")
    level:                  str = Field(..., description="Risk tier: low, moderate, or high")
    score:                  float = Field(..., description="Normalized risk index from 0.0 to 1.0")
    score_percent:          int = Field(..., description="Percentage risk index from 0 to 100")
    explanation:            str = Field(..., description="Honest traceable reason grounded in climate observations")
    recommended_action:     str = Field(..., description="Agronomic mitigation actions for extension/farmers")
    contributing_variables: Dict[str, Any] = Field(..., description="Telemetry values triggering the evaluation")


class ClimateRiskResponse(BaseModel):
    district:           str
    display_name:       str
    assessment_period:  Dict[str, Any]
    engine:             str
    engine_name:        str
    is_ai_model:        bool
    overall_risk_level: str
    overall_risk_score: float
    risks:              List[RiskItem]


@router.get("/climate", response_model=ClimateRiskResponse)
async def get_climate_risk(
    district:       str = Query("bogura", description="Target district (bogura, rangpur, dinajpur, rajshahi, sylhet)"),
    start:          Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end:            Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    temp_max:       Optional[float] = Query(None, description="Simulated max temperature override in °C"),
    precipitation:  Optional[float] = Query(None, description="Simulated precipitation override in mm"),
    soil_moisture:  Optional[float] = Query(None, description="Simulated root-zone moisture override (0.0–1.0 or %)"),
    humidity:       Optional[float] = Query(None, description="Simulated relative humidity override in %"),
):
    """
    Evaluates three core agroclimatic hazards:
    1. Drought Risk
    2. Flood / Excess Rainfall Risk
    3. Heat Stress Risk

    Uses real NASA POWER telemetry combined with transparent, defensible
    Bangladesh AEZ threshold logic. Supports what-if parameter simulation.
    """
    try:
        res = await assess_climate_risks_for_district(
            district=district,
            start=start,
            end=end,
            temp_max_override=temp_max,
            precip_override=precipitation,
            soil_moisture_override=soil_moisture,
            humidity_override=humidity,
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assess climate risk for {district}: {str(e)}"
        )
