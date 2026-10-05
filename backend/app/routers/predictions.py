from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PredictionInput(BaseModel):
    district:      str
    crop:          str               # "rice", "wheat", "maize", "jute"
    temp_avg:      float
    precipitation: float
    humidity:      float
    soil_moisture: float
    solar_rad:     Optional[float] = None


class PredictionResult(BaseModel):
    crop:            str
    district:        str
    suitability:     str             # "High" / "Medium" / "Low"
    confidence:      float           # 0.0 - 1.0
    recommendation:  str
    best_sow_month:  str


@router.post("/crop-suitability", response_model=PredictionResult)
def predict_crop_suitability(data: PredictionInput):
    """
    Climate data দিয়ে crop suitability predict করে।
    
    এখন rule-based logic আছে।
    পরে এখানে trained ML model (.pkl) লোড করা হবে।
    """
    score = _rule_based_score(data)

    if score >= 0.7:
        suitability = "High"
        recommendation = f"{data.crop.title()} চাষের জন্য এই মৌসুম উপযুক্ত। সার ও সেচের সঠিক ব্যবস্থা নিন।"
    elif score >= 0.4:
        suitability = "Medium"
        recommendation = f"{data.crop.title()} চাষ সম্ভব, তবে আবহাওয়া পরিবর্তনের দিকে নজর রাখুন।"
    else:
        suitability = "Low"
        recommendation = f"এই মৌসুমে {data.crop.title()} চাষ ঝুঁকিপূর্ণ। বিকল্প ফসল বিবেচনা করুন।"

    return PredictionResult(
        crop           = data.crop,
        district       = data.district,
        suitability    = suitability,
        confidence     = round(score, 2),
        recommendation = recommendation,
        best_sow_month = _best_sow_month(data.crop),
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _rule_based_score(d: PredictionInput) -> float:
    """
    Simple rule-based scoring (0–1).
    ML model train হলে এই function replace হবে।
    """
    score = 0.5  # base

    crop = d.crop.lower()

    if crop == "rice":
        if 24 <= d.temp_avg <= 35:      score += 0.15
        if d.precipitation >= 5:        score += 0.15
        if d.humidity >= 60:            score += 0.10
        if d.soil_moisture >= 0.5:      score += 0.10
    elif crop == "wheat":
        if 15 <= d.temp_avg <= 25:      score += 0.15
        if 2 <= d.precipitation <= 8:   score += 0.15
        if 40 <= d.humidity <= 70:      score += 0.10
        if d.soil_moisture >= 0.3:      score += 0.10
    elif crop == "jute":
        if 25 <= d.temp_avg <= 37:      score += 0.15
        if d.precipitation >= 8:        score += 0.15
        if d.humidity >= 70:            score += 0.20
    elif crop == "maize":
        if 20 <= d.temp_avg <= 30:      score += 0.15
        if 3 <= d.precipitation <= 10:  score += 0.15
        if 50 <= d.humidity <= 80:      score += 0.10
        if d.soil_moisture >= 0.3:      score += 0.10

    return min(score, 1.0)


def _best_sow_month(crop: str) -> str:
    months = {
        "rice":  "জুন–জুলাই (আমন), নভেম্বর–ডিসেম্বর (বোরো)",
        "wheat": "নভেম্বর–ডিসেম্বর",
        "jute":  "মার্চ–এপ্রিল",
        "maize": "অক্টোবর–নভেম্বর",
    }
    return months.get(crop.lower(), "জানুয়ারি")
