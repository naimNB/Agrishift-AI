"""
rotation.py — Pydantic Schemas for Crop Rotation Decision Engine
================================================================
Defines structured request and response contracts grounded in:
- Bangladesh Agricultural Research Council (BARC) AEZ Guidelines
- Bangladesh Agricultural Research Institute (BARI) Technologies
- Bangladesh Rice Research Institute (BRRI) Modern Rice Manuals
- NASA POWER Agroclimatology Telemetry
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CropRotationRequest(BaseModel):
    district:       str = Field("bogura", description="Bangladesh agricultural monitoring district (bogura, rangpur, dinajpur, rajshahi, sylhet)")
    current_crop:   str = Field("rice", description="Current standing or recently harvested crop (rice, wheat, maize, potato, mustard, jute, pulses)")
    season:         Optional[str] = Field("rabi", description="Current or upcoming season (rabi, kharif-1, kharif-2)")
    soil_type:      Optional[str] = Field("loam", description="Soil texture (loam, sandy_loam, clay, silt_loam)")
    has_irrigation: bool = Field(True, description="Whether assured irrigation (tubewell/canal) is available")
    latitude:       Optional[float] = Field(None, description="Optional custom latitude")
    longitude:      Optional[float] = Field(None, description="Optional custom longitude")


class RotationPlanItem(BaseModel):
    id:                     str
    title_bn:               str
    title_en:               str
    sequence_bn:            str
    sequence_en:            str
    crops:                  List[str]
    seasons:                List[str]
    duration_days_total:    int
    turnaround_days_margin: int
    is_feasible:            bool
    suitability_score:      float = Field(..., description="Normalized suitability score from 0.0 to 1.0")
    suitability_tier:       str = Field(..., description="Suitability tier: High, Moderate, Low, Infeasible")
    climate_suitability_score: int = Field(..., description="0-100 score based on historical climate observations")
    water_compatibility_score: int = Field(..., description="0-100 score based on irrigation and water balance")
    diversity_score:        int = Field(..., description="0-100 score based on crop diversity and soil nutrition")
    overall_rating:         str = Field(..., description="Farmer-friendly rating grade (A+, A, B+, Infeasible)")
    why_suitable_bn:        str
    why_suitable_en:        str
    soil_benefit_bn:        str
    soil_benefit_en:        str
    water_regime_bn:        str
    water_regime_en:        str
    risk_level_bn:          str
    risk_level_en:          str
    constraints:            List[str] = Field(default_factory=list)
    scientific_basis:       str


class CropRotationResponse(BaseModel):
    district:                               str
    display_name:                           str
    has_irrigation:                         bool
    soil_type:                              str
    current_crop:                           str
    season_context:                         str
    telemetry_source:                       str
    climate_context:                        Dict[str, Any]
    is_fallback_telemetry:                  bool
    recommended_rotations:                  List[RotationPlanItem]
    data_sources:                           List[str]
    scientific_assumptions_and_limitations: str
