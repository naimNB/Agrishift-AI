"""
AgriShift AI — Crop Recommendation and Ranking Service
======================================================
Evaluates and ranks agricultural candidate crops based on NASA agroclimatology telemetry
and Bangladesh Agro-Ecological Zones (AEZ) agronomic guidelines.

Candidate Crops:
- Rice (ধান)
- Wheat (গম)
- Maize (ভুট্টা)
- Jute (পাট)
- Potato (আলু)
- Mustard (সরিষা)
"""

import math
from pathlib import Path
from typing import Optional, Dict, Any, List

# ML Model artifact path
ML_DIR = Path(__file__).resolve().parent.parent.parent / "ml_models"

# Supported candidate crops
CANDIDATE_CROPS = ["rice", "wheat", "maize", "jute", "potato", "mustard"]

CROP_METADATA = {
    "rice": {
        "display_name": "Rice (ধান)",
        "bengali_name": "ধান",
        "category": "Cereal / Staple",
        "ideal_temp": (22.0, 34.0),
        "ideal_precip": (5.0, 25.0),
        "ideal_humidity": (65.0, 95.0),
        "ideal_soil_moisture": (0.50, 1.00),
        "sowing_period": "June–July (T. Aman) / Nov–Dec (Boro)",
        "water_regime": "High (Paddy flooding / AWD conservation)",
        "ideal_solar": (14.0, 22.0),
    },
    "wheat": {
        "display_name": "Wheat (গম)",
        "bengali_name": "গম",
        "category": "Cereal / Rabi Grain",
        "ideal_temp": (15.0, 24.0),
        "ideal_precip": (1.0, 6.0),
        "ideal_humidity": (40.0, 70.0),
        "ideal_soil_moisture": (0.30, 0.55),
        "sowing_period": "Mid-November to early December (Nov 15–30 optimum)",
        "water_regime": "Moderate (2–3 supplemental irrigations)",
        "ideal_solar": (12.0, 20.0),
    },
    "maize": {
        "display_name": "Maize (ভুট্টা)",
        "bengali_name": "ভুট্টা",
        "category": "Cereal / Fodder & Feed",
        "ideal_temp": (18.0, 30.0),
        "ideal_precip": (3.0, 12.0),
        "ideal_humidity": (50.0, 80.0),
        "ideal_soil_moisture": (0.35, 0.65),
        "sowing_period": "October–November (Rabi) / Feb–March (Kharif-1)",
        "water_regime": "Moderate (Well-drained soils, no waterlogging)",
        "ideal_solar": (14.0, 22.0),
    },
    "jute": {
        "display_name": "Jute (পাট)",
        "bengali_name": "পাট",
        "category": "Fiber / Cash Crop",
        "ideal_temp": (25.0, 38.0),
        "ideal_precip": (8.0, 22.0),
        "ideal_humidity": (70.0, 95.0),
        "ideal_soil_moisture": (0.50, 0.85),
        "sowing_period": "March–April (Pre-monsoon / Baishakh)",
        "water_regime": "High rainfall & warm humid climate",
        "ideal_solar": (13.0, 21.0),
    },
    "potato": {
        "display_name": "Potato (আলু)",
        "bengali_name": "আলু",
        "category": "Tuber / Cash Crop",
        "ideal_temp": (14.0, 22.0),
        "ideal_precip": (0.5, 4.0),
        "ideal_humidity": (60.0, 80.0),
        "ideal_soil_moisture": (0.35, 0.55),
        "sowing_period": "November (Nov 10–25 prime sowing window)",
        "water_regime": "Light frequent irrigation, well-drained ridge",
        "ideal_solar": (11.0, 18.0),
    },
    "mustard": {
        "display_name": "Mustard (সরিষা)",
        "bengali_name": "সরিষা",
        "category": "Oilseed / Short-Duration Rabi",
        "ideal_temp": (14.0, 24.0),
        "ideal_precip": (0.0, 3.5),
        "ideal_humidity": (40.0, 70.0),
        "ideal_soil_moisture": (0.25, 0.45),
        "sowing_period": "Mid-October to mid-November",
        "water_regime": "Low (1 irrigation at flowering, dry weather favored)",
        "ideal_solar": (11.0, 18.0),
    },
}


def _normalize_soil_moisture(val: float) -> float:
    """Ensure soil moisture is normalized to a 0.0 - 1.0 fraction."""
    if val is None:
        return 0.5
    if val > 1.0:
        return val / 100.0
    return max(0.0, min(1.0, val))


def _calc_factor_score(val: float, ideal_min: float, ideal_max: float, spread: float = 5.0) -> int:
    """
    Computes transparent, continuous physiological suitability score (15% to 98%).
    Values within optimal range yield 88–98%.
    Values outside decay smoothly with distance.
    """
    if ideal_min <= val <= ideal_max:
        mid = (ideal_min + ideal_max) / 2.0
        half_width = max(1e-5, (ideal_max - ideal_min) / 2.0)
        norm_dist = abs(val - mid) / half_width
        score = 98 - int(round(norm_dist * 8))
        return max(88, min(98, score))
    elif val < ideal_min:
        d = ideal_min - val
        penalty = min(73, (d / spread) * 70)
        return max(15, int(round(88 - penalty)))
    else:
        d = val - ideal_max
        penalty = min(73, (d / spread) * 70)
        return max(15, int(round(88 - penalty)))


def compute_crop_explanation(
    crop: str,
    temp_avg: float,
    precipitation: float,
    humidity: float,
    soil_moisture: float,
    solar_rad: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Generates explainable suitability breakdown across 5 core agronomic factors:
    - Temperature suitability (0–100%)
    - Rainfall suitability (0–100%)
    - Humidity suitability (0–100%)
    - Soil moisture suitability (0–100%)
    - Solar radiation suitability (0–100%)

    Also provides specific qualitative favorable factors and caution factors.
    """
    crop_key = crop.lower().strip()
    meta = CROP_METADATA.get(crop_key, CROP_METADATA["rice"])
    norm_soil = _normalize_soil_moisture(soil_moisture)
    s_rad = solar_rad if solar_rad is not None else 15.0

    t_min, t_max = meta["ideal_temp"]
    p_min, p_max = meta["ideal_precip"]
    h_min, h_max = meta["ideal_humidity"]
    m_min, m_max = meta["ideal_soil_moisture"]
    rad_min, rad_max = meta.get("ideal_solar", (13.0, 21.0))

    temp_score = _calc_factor_score(temp_avg, t_min, t_max, spread=7.0)
    rain_score = _calc_factor_score(precipitation, p_min, p_max, spread=10.0 if crop_key == "rice" else 6.0)
    hum_score = _calc_factor_score(humidity, h_min, h_max, spread=15.0)
    if humidity > 82.0 and crop_key in ["potato", "mustard", "wheat"]:
        hum_score = min(hum_score, 52)
    moist_score = _calc_factor_score(norm_soil, m_min, m_max, spread=0.22)
    solar_score = _calc_factor_score(s_rad, rad_min, rad_max, spread=4.0)

    factor_scores = {
        "temperature": temp_score,
        "rainfall": rain_score,
        "humidity": hum_score,
        "soil_moisture": moist_score,
        "solar_radiation": solar_score,
    }

    favorable_factors: List[str] = []
    caution_factors: List[str] = []

    # Temperature
    if temp_score >= 80:
        favorable_factors.append(
            f"Temperature ({temp_avg:.1f}°C) is in optimal physiological range ({t_min:.0f}–{t_max:.0f}°C)."
        )
    elif temp_avg > t_max:
        caution_factors.append(
            f"Thermal stress: Current temperature ({temp_avg:.1f}°C) exceeds the {t_max:.0f}°C ceiling for this crop."
        )
    elif temp_avg < t_min:
        caution_factors.append(
            f"Cold constraint: Current temperature ({temp_avg:.1f}°C) is below the {t_min:.0f}°C base requirement."
        )

    # Rainfall
    if rain_score >= 80:
        favorable_factors.append(
            f"Precipitation ({precipitation:.1f} mm/day) matches water demand without waterlogging risk."
        )
    elif precipitation > p_max:
        caution_factors.append(
            f"Excess rainfall ({precipitation:.1f} mm/day) exceeds dry-season threshold ({p_max:.1f} mm), increasing disease or lodging risk."
        )
    elif precipitation < p_min:
        caution_factors.append(
            f"Low daily precipitation ({precipitation:.1f} mm/day); crop will require supplemental irrigation."
        )

    # Humidity
    if hum_score >= 80:
        favorable_factors.append(
            f"Relative humidity ({humidity:.1f}%) provides balanced transpiration and low foliar stress."
        )
    elif humidity > 82.0 and crop_key in ["potato", "mustard", "wheat"]:
        caution_factors.append(
            f"High humidity ({humidity:.1f}%) elevates late blight (Phytophthora) and aphid disease risk."
        )
    elif humidity > h_max:
        caution_factors.append(
            f"Elevated humidity ({humidity:.1f}%) exceeds typical {h_max:.0f}% threshold, increasing fungal spore viability."
        )
    elif humidity < h_min:
        caution_factors.append(
            f"Low humidity ({humidity:.1f}%) increases vapor pressure deficit and evapotranspiration rate."
        )

    # Soil moisture
    if moist_score >= 80:
        favorable_factors.append(
            f"Root-zone wetness ({(norm_soil*100):.1f}%) provides ideal moisture profile without root hypoxia."
        )
    elif norm_soil > m_max:
        caution_factors.append(
            f"Excess root-zone wetness ({(norm_soil*100):.1f}%) exceeds {m_max*100:.0f}% tolerance; requires ridge drainage to prevent root rot."
        )
    elif norm_soil < m_min:
        caution_factors.append(
            f"Sub-surface moisture deficit ({(norm_soil*100):.1f}%) is below {m_min*100:.0f}% field capacity requirement."
        )

    # Solar radiation
    if solar_score >= 80:
        favorable_factors.append(
            f"Solar radiation ({s_rad:.1f} kWh/m²/day) provides abundant photosynthetically active radiation (PAR)."
        )
    elif s_rad < rad_min:
        caution_factors.append(
            f"Low solar radiation ({s_rad:.1f} kWh/m²/day) may slow photosynthetic biomass accumulation."
        )

    if not favorable_factors:
        favorable_factors.append("Moderate overall baseline adaptation to regional soil conditions.")

    if not caution_factors:
        caution_factors.append("No critical agroclimatic bottlenecks identified under current parameters.")

    return {
        "factor_scores": factor_scores,
        "favorable_factors": favorable_factors,
        "caution_factors": caution_factors,
    }


def evaluate_crop_agronomic(
    crop: str,
    temp_avg: float,
    precipitation: float,
    humidity: float,
    soil_moisture: float,
    solar_rad: Optional[float] = None,
    wind_speed: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Evaluates suitability of a single crop using Bangladesh AEZ agronomic rules.
    Returns score (0.0–1.0), suitability tier, detailed reasoning points, and constraints.
    """
    crop_key = crop.lower().strip()
    meta = CROP_METADATA.get(crop_key, CROP_METADATA["rice"])
    norm_soil = _normalize_soil_moisture(soil_moisture)

    score = 0.50  # baseline prior
    reasoning: List[str] = []
    stress_factors: List[str] = []

    # 1. Temperature Analysis
    t_min, t_max = meta["ideal_temp"]
    if t_min <= temp_avg <= t_max:
        score += 0.18
        reasoning.append(
            f"Ambient temperature ({temp_avg:.1f}°C) is in optimal physiological range ({t_min:.0f}–{t_max:.0f}°C)."
        )
    elif abs(temp_avg - t_min) <= 3.0 or abs(temp_avg - t_max) <= 3.0:
        score += 0.05
        reasoning.append(
            f"Temperature ({temp_avg:.1f}°C) is near borderline for optimal growth ({t_min:.0f}–{t_max:.0f}°C)."
        )
    else:
        penalty = 0.15
        score -= penalty
        if temp_avg > t_max:
            stress_factors.append(f"Thermal stress: current temp ({temp_avg:.1f}°C) exceeds {t_max:.0f}°C ceiling.")
            reasoning.append(f"High temperature ({temp_avg:.1f}°C) poses thermal inhibition; cooling or later sowing needed.")
        else:
            stress_factors.append(f"Cold constraint: current temp ({temp_avg:.1f}°C) is below {t_min:.0f}°C threshold.")
            reasoning.append(f"Temperature is too low ({temp_avg:.1f}°C); vegetative development may slow down.")

    # 2. Moisture & Irrigation Regime Analysis
    m_min, m_max = meta["ideal_soil_moisture"]
    if m_min <= norm_soil <= m_max:
        score += 0.14
        reasoning.append(
            f"Root-zone soil wetness ({(norm_soil*100):.1f}%) provides sufficient profile hydration without waterlogging."
        )
    elif norm_soil > m_max:
        score -= 0.08
        stress_factors.append(f"Excess moisture: soil wetness ({(norm_soil*100):.1f}%) may risk root hypoxia or fungal spread.")
        reasoning.append(f"Soil wetness is elevated for this crop; drainage management required.")
    else:
        score -= 0.10
        stress_factors.append(f"Water deficit: soil moisture ({(norm_soil*100):.1f}%) is below {m_min*100:.0f}% requirement.")
        reasoning.append(f"Moisture is below optimum; supplemental irrigation will be needed.")

    # 3. Rainfall / Precipitation Analysis
    p_min, p_max = meta["ideal_precip"]
    if p_min <= precipitation <= p_max:
        score += 0.10
        reasoning.append(f"Daily precipitation ({precipitation:.1f} mm) is well-suited to water requirements.")
    elif precipitation > p_max:
        score -= 0.08
        if crop_key in ["wheat", "mustard", "potato"]:
            stress_factors.append(f"High rainfall ({precipitation:.1f} mm) increases foliar blight and disease risk.")
        reasoning.append(f"Precipitation ({precipitation:.1f} mm) exceeds dry-weather preference.")
    else:
        score -= 0.04
        reasoning.append(f"Low precipitation ({precipitation:.1f} mm); reliance on tubewell/AWD irrigation.")

    # 4. Relative Humidity Analysis
    h_min, h_max = meta["ideal_humidity"]
    if h_min <= humidity <= h_max:
        score += 0.06
        reasoning.append(f"Relative humidity ({humidity:.1f}%) aligns with canopy evapotranspiration balance.")
    elif humidity > 85.0 and crop_key in ["potato", "mustard", "wheat"]:
        score -= 0.08
        stress_factors.append("Persistent high humidity (>85%) raises late blight and aphid pest vulnerability.")
        reasoning.append(f"High humidity ({humidity:.1f}%) creates fungal disease susceptibility.")
    else:
        score -= 0.03
        reasoning.append(f"Humidity ({humidity:.1f}%) deviates moderately from typical target ({h_min:.0f}–{h_max:.0f}%).")

    # 5. Solar Radiation Analysis (if provided)
    if solar_rad is not None:
        if solar_rad >= 14.0:
            score += 0.04
            reasoning.append(f"Abundant surface solar irradiance ({solar_rad:.1f} kWh/m²/day) supports active photosynthesis.")
        elif solar_rad < 10.0:
            score -= 0.03
            reasoning.append(f"Low solar radiation ({solar_rad:.1f} kWh/m²/day) may slow biomass accumulation.")

    # Compute explainable factor breakdown
    explanation = compute_crop_explanation(
        crop=crop_key,
        temp_avg=temp_avg,
        precipitation=precipitation,
        humidity=humidity,
        soil_moisture=soil_moisture,
        solar_rad=solar_rad,
    )

    # Clamp score between 0.10 and 0.98
    final_score = round(max(0.10, min(0.98, score)), 2)

    if final_score >= 0.70:
        suitability = "High"
    elif final_score >= 0.45:
        suitability = "Medium"
    else:
        suitability = "Low"

    return {
        "crop": crop_key,
        "display_name": meta["display_name"],
        "category": meta["category"],
        "score": final_score,
        "suitability": suitability,
        "factor_scores": explanation["factor_scores"],
        "favorable_factors": explanation["favorable_factors"],
        "caution_factors": explanation["caution_factors"],
        "reasoning": reasoning,
        "stress_factors": stress_factors,
        "sowing_period": meta["sowing_period"],
        "water_regime": meta["water_regime"],
    }


def rank_crops_rule_based(
    location: str,
    temp_avg: float,
    precipitation: float,
    humidity: float,
    soil_moisture: float,
    solar_rad: Optional[float] = None,
    wind_speed: Optional[float] = None,
    candidate_crops: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Ranks all candidate crops using the defensible agronomic rule-based model.
    """
    target_crops = candidate_crops or CANDIDATE_CROPS
    evaluated = []

    for crop in target_crops:
        res = evaluate_crop_agronomic(
            crop=crop,
            temp_avg=temp_avg,
            precipitation=precipitation,
            humidity=humidity,
            soil_moisture=soil_moisture,
            solar_rad=solar_rad,
            wind_speed=wind_speed,
        )
        evaluated.append(res)

    # Sort descending by score
    evaluated.sort(key=lambda x: x["score"], reverse=True)

    # Assign ranks
    for i, item in enumerate(evaluated):
        item["rank"] = i + 1

    best_crop = evaluated[0]["crop"] if evaluated else "rice"

    return {
        "location": location.lower().strip(),
        "engine": "rule_based",
        "engine_name": "Agro-Ecological Zone (AEZ) Agronomic Ranking Engine",
        "is_ai_model": False,
        "climate_snapshot": {
            "temp_avg": temp_avg,
            "precipitation": precipitation,
            "humidity": humidity,
            "soil_moisture": _normalize_soil_moisture(soil_moisture),
            "solar_rad": solar_rad,
            "wind_speed": wind_speed,
        },
        "best_crop": best_crop,
        "recommendations": evaluated,
        "global_feature_importance": get_global_feature_importances(),
    }


_LOADED_PIPELINE = None
_LOADED_METADATA = None


def get_model_metadata() -> Optional[Dict[str, Any]]:
    """Loads model_metadata.json from artifacts directory if present."""
    global _LOADED_METADATA
    if _LOADED_METADATA is not None:
        return _LOADED_METADATA

    meta_file = ML_DIR / "model_metadata.json"
    if meta_file.exists():
        try:
            import json
            with open(meta_file, "r", encoding="utf-8") as f:
                _LOADED_METADATA = json.load(f)
                return _LOADED_METADATA
        except Exception:
            return None
    return None


def get_ml_pipeline():
    """Loads and caches the trained scikit-learn pipeline safely."""
    global _LOADED_PIPELINE
    if _LOADED_PIPELINE is not None:
        return _LOADED_PIPELINE

    pipe_path = ML_DIR / "best_model_pipeline.joblib"
    if pipe_path.exists():
        try:
            import joblib
            _LOADED_PIPELINE = joblib.load(pipe_path)
            return _LOADED_PIPELINE
        except Exception as e:
            print(f"Warning: Failed to load {pipe_path}: {e}")

    return None


def get_global_feature_importances() -> Dict[str, float]:
    """
    Returns global feature importance from the trained RandomForest model.
    Maps input parameters to their global tree split contribution weights.
    """
    pipe = get_ml_pipeline()
    if pipe is not None and "classifier" in pipe.named_steps:
        try:
            clf = pipe.named_steps["classifier"]
            prep = pipe.named_steps["preprocessor"]
            num_cols = ["temp_avg", "precipitation", "humidity", "soil_moisture", "solar_rad"]
            cat_cols = list(prep.named_transformers_["cat"].get_feature_names_out(["crop"]))
            all_cols = num_cols + cat_cols
            importances = dict(zip(all_cols, clf.feature_importances_))

            return {
                "solar_radiation": round(float(importances.get("solar_rad", 0.331)), 3),
                "humidity": round(float(importances.get("humidity", 0.132)), 3),
                "soil_moisture": round(float(importances.get("soil_moisture", 0.125)), 3),
                "temperature": round(float(importances.get("temp_avg", 0.091)), 3),
                "rainfall": round(float(importances.get("precipitation", 0.064)), 3),
            }
        except Exception:
            pass

    return {
        "solar_radiation": 0.331,
        "humidity": 0.132,
        "soil_moisture": 0.125,
        "temperature": 0.091,
        "rainfall": 0.064,
    }


def rank_crops_ml(
    location: str,
    temp_avg: float,
    precipitation: float,
    humidity: float,
    soil_moisture: float,
    solar_rad: Optional[float] = None,
    candidate_crops: Optional[List[str]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Evaluates candidate crops using the best trained scikit-learn pipeline.
    Falls back gracefully if pipeline is unavailable or fails inference.
    """
    pipe = get_ml_pipeline()
    metadata = get_model_metadata()

    # If new pipeline artifact is not found, attempt legacy loader
    if pipe is None:
        return _rank_crops_legacy_ml(
            location=location,
            temp_avg=temp_avg,
            precipitation=precipitation,
            humidity=humidity,
            soil_moisture=soil_moisture,
            solar_rad=solar_rad,
            candidate_crops=candidate_crops,
        )

    try:
        import pandas as pd

        target_crops = candidate_crops or CANDIDATE_CROPS
        evaluated = []
        norm_soil = _normalize_soil_moisture(soil_moisture)
        s_rad = solar_rad if solar_rad is not None else 15.0

        for crop_key in target_crops:
            crop_key = crop_key.lower().strip()
            if crop_key not in CANDIDATE_CROPS:
                continue

            x_df = pd.DataFrame([{
                "crop":          crop_key,
                "temp_avg":      temp_avg,
                "precipitation": precipitation,
                "humidity":      humidity,
                "soil_moisture": norm_soil,
                "solar_rad":     s_rad,
            }])

            # Predict probabilities and class label
            probs = pipe.predict_proba(x_df)[0]
            classes = list(pipe.classes_)
            class_prob = dict(zip(classes, probs))

            # Composite compatibility score: P(High)*1.0 + P(Medium)*0.55 + P(Low)*0.15
            raw_score = (
                class_prob.get("High", 0.0) * 1.0 +
                class_prob.get("Medium", 0.0) * 0.55 +
                class_prob.get("Low", 0.0) * 0.15
            )
            final_score = round(max(0.10, min(0.98, raw_score)), 2)
            pred_label = str(pipe.predict(x_df)[0])

            meta = CROP_METADATA.get(crop_key, CROP_METADATA["rice"])

            # Combine ML predictions with domain-specific agronomic reasoning
            agronomic_eval = evaluate_crop_agronomic(
                crop=crop_key,
                temp_avg=temp_avg,
                precipitation=precipitation,
                humidity=humidity,
                soil_moisture=soil_moisture,
                solar_rad=solar_rad,
            )

            evaluated.append({
                "crop": crop_key,
                "display_name": meta["display_name"],
                "category": meta["category"],
                "score": final_score,
                "suitability": pred_label,
                "factor_scores": agronomic_eval["factor_scores"],
                "favorable_factors": agronomic_eval["favorable_factors"],
                "caution_factors": agronomic_eval["caution_factors"],
                "reasoning": agronomic_eval["reasoning"],
                "stress_factors": agronomic_eval["stress_factors"],
                "sowing_period": meta["sowing_period"],
                "water_regime": meta["water_regime"],
                "ml_probabilities": {k: round(float(v), 3) for k, v in class_prob.items()},
            })

        evaluated.sort(key=lambda x: x["score"], reverse=True)
        for i, item in enumerate(evaluated):
            item["rank"] = i + 1

        best_crop = evaluated[0]["crop"] if evaluated else "rice"
        model_name = metadata.get("model_name", "RandomForest") if metadata else "RandomForest"

        return {
            "location": location.lower().strip(),
            "engine": f"ml_{model_name.lower()}",
            "engine_name": f"{model_name} Classifier (Sklearn Pipeline)",
            "is_ai_model": True,
            "climate_snapshot": {
                "temp_avg": temp_avg,
                "precipitation": precipitation,
                "humidity": humidity,
                "soil_moisture": norm_soil,
                "solar_rad": solar_rad,
            },
            "best_crop": best_crop,
            "recommendations": evaluated,
            "global_feature_importance": get_global_feature_importances(),
        }

    except Exception as e:
        print(f"ML Pipeline inference exception: {e}. Falling back to rule-based.")
        return None


def _rank_crops_legacy_ml(
    location: str,
    temp_avg: float,
    precipitation: float,
    humidity: float,
    soil_moisture: float,
    solar_rad: Optional[float] = None,
    candidate_crops: Optional[List[str]] = None,
) -> Optional[Dict[str, Any]]:
    """Legacy model loader fallback if best_model_pipeline is not present."""
    model_path = ML_DIR / "crop_model.pkl"
    crop_enc_path = ML_DIR / "crop_encoder.pkl"
    label_enc_path = ML_DIR / "label_encoder.pkl"

    if not (model_path.exists() and crop_enc_path.exists() and label_enc_path.exists()):
        return None

    try:
        import joblib
        import pandas as pd

        model = joblib.load(model_path)
        crop_encoder = joblib.load(crop_enc_path)
        label_encoder = joblib.load(label_enc_path)

        target_crops = candidate_crops or CANDIDATE_CROPS
        evaluated = []
        norm_soil = _normalize_soil_moisture(soil_moisture)
        s_rad = solar_rad if solar_rad is not None else 15.0

        for crop in target_crops:
            crop_key = crop.lower().strip()
            if crop_key not in crop_encoder.classes_:
                continue

            c_enc = crop_encoder.transform([crop_key])[0]
            x_df = pd.DataFrame([{
                "crop_enc": c_enc,
                "temp_avg": temp_avg,
                "precipitation": precipitation,
                "humidity": humidity,
                "soil_moisture": norm_soil,
                "solar_rad": s_rad,
            }])

            probs = model.predict_proba(x_df)[0]
            classes = label_encoder.classes_
            class_prob = dict(zip(classes, probs))

            score = (
                class_prob.get("High", 0.0) * 1.0 +
                class_prob.get("Medium", 0.0) * 0.55 +
                class_prob.get("Low", 0.0) * 0.15
            )
            score = round(max(0.10, min(0.98, score)), 2)

            pred_label = label_encoder.inverse_transform(model.predict(x_df))[0]
            meta = CROP_METADATA.get(crop_key, CROP_METADATA["rice"])

            agronomic_eval = evaluate_crop_agronomic(
                crop=crop_key,
                temp_avg=temp_avg,
                precipitation=precipitation,
                humidity=humidity,
                soil_moisture=soil_moisture,
                solar_rad=solar_rad,
            )

            evaluated.append({
                "crop": crop_key,
                "display_name": meta["display_name"],
                "category": meta["category"],
                "score": score,
                "suitability": pred_label,
                "factor_scores": agronomic_eval["factor_scores"],
                "favorable_factors": agronomic_eval["favorable_factors"],
                "caution_factors": agronomic_eval["caution_factors"],
                "reasoning": agronomic_eval["reasoning"],
                "stress_factors": agronomic_eval["stress_factors"],
                "sowing_period": meta["sowing_period"],
                "water_regime": meta["water_regime"],
                "ml_probabilities": {k: round(float(v), 3) for k, v in class_prob.items()},
            })

        evaluated.sort(key=lambda x: x["score"], reverse=True)
        for i, item in enumerate(evaluated):
            item["rank"] = i + 1

        best_crop = evaluated[0]["crop"] if evaluated else "rice"

        return {
            "location": location.lower().strip(),
            "engine": "ml_random_forest",
            "engine_name": "Trained RandomForest Multi-Crop Classifier",
            "is_ai_model": True,
            "climate_snapshot": {
                "temp_avg": temp_avg,
                "precipitation": precipitation,
                "humidity": humidity,
                "soil_moisture": norm_soil,
                "solar_rad": solar_rad,
            },
            "best_crop": best_crop,
            "recommendations": evaluated,
            "global_feature_importance": get_global_feature_importances(),
        }
    except Exception:
        return None
