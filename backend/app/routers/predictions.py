from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.services.prediction_service import (
    evaluate_crop_agronomic,
    rank_crops_rule_based,
    rank_crops_ml,
    CANDIDATE_CROPS,
    CROP_METADATA,
)

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    district:      str               # e.g. "bogura", "rangpur", "dinajpur", "rajshahi"
    crop:          str               # "rice", "wheat", "maize", "jute", "potato", "mustard"
    temp_avg:      float
    precipitation: float
    humidity:      float
    soil_moisture: float
    solar_rad:     Optional[float] = None
    wind_speed:    Optional[float] = None


class CropFactorScores(BaseModel):
    temperature:     int = Field(..., description="Temperature suitability score (0-100%)")
    rainfall:        int = Field(..., description="Rainfall / precipitation suitability score (0-100%)")
    humidity:        int = Field(..., description="Relative humidity suitability score (0-100%)")
    soil_moisture:   int = Field(..., description="Root-zone soil moisture suitability score (0-100%)")
    solar_radiation: int = Field(..., description="Solar radiation suitability score (0-100%)")


class PredictionResult(BaseModel):
    crop:              str
    district:          str
    suitability:       str             # "High" / "Medium" / "Low"
    confidence:        float           # 0.0 - 1.0
    recommendation:    str
    best_sow_month:    str
    reasoning:         Optional[List[str]] = None
    stress_factors:    Optional[List[str]] = None
    factor_scores:     Optional[CropFactorScores] = None
    favorable_factors: Optional[List[str]] = None
    caution_factors:   Optional[List[str]] = None


class RankCropsInput(BaseModel):
    location:      Optional[str] = None
    district:      Optional[str] = "bogura"
    temp_avg:      float = Field(..., description="Average ambient temperature in °C")
    precipitation: float = Field(..., description="Daily precipitation in mm")
    humidity:      float = Field(..., description="Relative humidity in %")
    soil_moisture: float = Field(..., description="Root-zone soil moisture (fraction 0-1 or %)")
    solar_rad:     Optional[float] = Field(None, description="Solar radiation in kWh/m²/day")
    wind_speed:    Optional[float] = Field(None, description="Surface wind speed in m/s")
    use_ml:        bool = Field(False, description="Whether to evaluate using RandomForest classifier artifact")


class CropRecommendationItem(BaseModel):
    crop:              str
    display_name:      str
    category:          str
    score:             float
    rank:              int
    suitability:       str
    factor_scores:     CropFactorScores
    favorable_factors: List[str]
    caution_factors:   List[str]
    reasoning:         List[str]
    stress_factors:    List[str]
    sowing_period:     str
    water_regime:      str
    ml_probabilities:  Optional[Dict[str, float]] = None


class RankCropsResponse(BaseModel):
    location:                  str
    district:                  str
    engine:                    str            # "rule_based" or "ml_random_forest"
    engine_name:               str
    is_ai_model:               bool
    best_crop:                 str
    climate_snapshot:          Dict[str, Any]
    recommendations:           List[CropRecommendationItem]
    global_feature_importance: Optional[Dict[str, float]] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/rank-crops", response_model=RankCropsResponse)
def rank_candidate_crops(data: RankCropsInput):
    """
    Given climate/environmental conditions, evaluate and rank all candidate crops:
    - Rice (ধান)
    - Wheat (গম)
    - Maize (ভুট্টা)
    - Jute (পাট)
    - Potato (আলু)
    - Mustard (সরিষা)

    Returns ranked list with compatibility scores, ranks, and agronomic reasoning.
    Clearly identifies whether results are from the Bangladesh AEZ rule engine
    or the trained RandomForest ML classifier.
    """
    loc = (data.location or data.district or "bogura").strip()

    if data.use_ml:
        ml_res = rank_crops_ml(
            location=loc,
            temp_avg=data.temp_avg,
            precipitation=data.precipitation,
            humidity=data.humidity,
            soil_moisture=data.soil_moisture,
            solar_rad=data.solar_rad,
        )
        if ml_res is not None:
            ml_res["district"] = loc
            return ml_res

    # Default defensible rule-based baseline
    res = rank_crops_rule_based(
        location=loc,
        temp_avg=data.temp_avg,
        precipitation=data.precipitation,
        humidity=data.humidity,
        soil_moisture=data.soil_moisture,
        solar_rad=data.solar_rad,
        wind_speed=data.wind_speed,
    )
    res["district"] = loc
    return res


@router.post("/crop-suitability", response_model=PredictionResult)
def predict_crop_suitability(data: PredictionInput):
    """
    Evaluates suitability for a single crop (legacy endpoint preserved).
    """
    crop = data.crop.lower().strip()
    eval_res = evaluate_crop_agronomic(
        crop=crop,
        temp_avg=data.temp_avg,
        precipitation=data.precipitation,
        humidity=data.humidity,
        soil_moisture=data.soil_moisture,
        solar_rad=data.solar_rad,
        wind_speed=data.wind_speed,
    )

    suitability = eval_res["suitability"]
    score = eval_res["score"]

    if suitability == "High":
        recommendation = (
            f"{crop.title()} চাষের জন্য বর্তমান জলবায়ু ও মাটির আর্দ্রতা অত্যন্ত অনুকূল। "
            f"উপযুক্ত বপন মৌসুম: {eval_res['sowing_period']}।"
        )
    elif suitability == "Medium":
        stress_text = " ও ".join(eval_res["stress_factors"]) if eval_res["stress_factors"] else "জলবায়ু ঝুঁকি"
        recommendation = (
            f"{crop.title()} চাষ মাঝারি অনুকূল ({stress_text})। "
            f"সঠিক সেচ ও খরা/তাপ ব্যবস্থাপনা নিশ্চিত করুন।"
        )
    else:
        recommendation = (
            f"এই মৌসুমে {crop.title()} চাষ প্রতিকূল। "
            f"বিকল্প ফসল (যেমন গম/ভুট্টা/সরিষা) বিবেচনা করুন।"
        )

    return PredictionResult(
        crop              = crop,
        district          = data.district,
        suitability       = suitability,
        confidence        = score,
        recommendation    = recommendation,
        best_sow_month    = eval_res["sowing_period"],
        reasoning         = eval_res["reasoning"],
        stress_factors    = eval_res["stress_factors"],
        factor_scores     = eval_res.get("factor_scores"),
        favorable_factors = eval_res.get("favorable_factors"),
        caution_factors   = eval_res.get("caution_factors"),
    )
