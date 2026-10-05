"""
climate_risk_service.py — Climate Risk Intelligence Service
===========================================================
Evaluates agroclimatic risk hazards across three core categories:
1. Drought Risk
2. Flood / Excess Rainfall Risk
3. Heat Stress Risk

Uses real NASA POWER agroclimatology telemetry combined with transparent,
defensible agronomic threshold logic aligned with BARC & BMD standards.
"""

import math
from datetime import date, timedelta
from typing import Optional, Dict, Any, List

from app.services.nasa_service import fetch_nasa_power_data, DISTRICT_COORDS
from app.services.climate_risk_config import (
    DROUGHT_THRESHOLDS,
    FLOOD_THRESHOLDS,
    HEAT_STRESS_THRESHOLDS,
)


def _compute_heat_index(temp_c: float, humidity_pct: float) -> float:
    """
    Simplified Rothfusz / Steadman heat index approximation in Celsius.
    """
    if temp_c < 26.0 or humidity_pct < 40.0:
        return temp_c

    t_f = temp_c * 9.0 / 5.0 + 32.0
    r = humidity_pct

    # Steadman simple equation
    hi_f = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (r * 0.094))
    if hi_f > 80.0:
        # Full Rothfusz polynomial
        hi_f = (
            -42.379
            + 2.04901523 * t_f
            + 10.14333127 * r
            - 0.22475541 * t_f * r
            - 0.00683783 * t_f * t_f
            - 0.05481717 * r * r
            + 0.00122874 * t_f * t_f * r
            + 0.00085282 * t_f * r * r
            - 0.00000199 * t_f * t_f * r * r
        )
    return round((hi_f - 32.0) * 5.0 / 9.0, 1)


def _determine_risk_tier(score: float) -> str:
    if score >= 0.65:
        return "high"
    elif score >= 0.35:
        return "moderate"
    return "low"


def evaluate_drought_risk(
    soil_moisture: float,
    total_rain_period: float,
    max_dry_spell: int,
    temp_avg: float,
    humidity: float,
) -> Dict[str, Any]:
    """
    Calculates drought vulnerability score (0.0 to 1.0).
    """
    cfg = DROUGHT_THRESHOLDS
    weights = cfg["weights"]

    # 1. Soil Moisture Subscore (0 to 1)
    # Below severe (0.30) -> 1.0; Above safe (0.60) -> 0.0
    if soil_moisture <= cfg["soil_moisture_severe"]:
        s_moist = 1.0
    elif soil_moisture >= cfg["soil_moisture_safe"]:
        s_moist = 0.05
    else:
        # Linear decay between 0.30 and 0.60
        s_moist = 1.0 - ((soil_moisture - cfg["soil_moisture_severe"]) / 
                         (cfg["soil_moisture_safe"] - cfg["soil_moisture_severe"]))

    # 2. Rainfall Deficit Subscore
    if total_rain_period <= cfg["precip_14day_severe_mm"]:
        s_rain = 1.0
    elif total_rain_period >= cfg["precip_14day_moderate_mm"] * 2.0:
        s_rain = 0.05
    else:
        s_rain = max(0.0, 1.0 - (total_rain_period / (cfg["precip_14day_moderate_mm"] * 2.0)))

    # Dry spell amplification
    if max_dry_spell >= cfg["dry_spell_days_severe"]:
        s_rain = min(1.0, s_rain + 0.20)

    # 3. Evaporative Demand Subscore (high temp + low humidity)
    evap_metric = (temp_avg / 35.0) * (1.0 - min(1.0, humidity / 100.0))
    s_evap = max(0.0, min(1.0, evap_metric * 1.5))

    # Composite Score
    score = round(
        weights["soil_moisture"] * s_moist +
        weights["rainfall_deficit"] * s_rain +
        weights["evaporative_demand"] * s_evap,
        2
    )
    score = max(0.05, min(0.98, score))
    level = _determine_risk_tier(score)

    # Contextual explanation
    moist_pct = round(soil_moisture * 100, 1)
    if level == "high":
        explanation = (
            f"Critical moisture deficit: root-zone wetness is critically depressed at {moist_pct}%, "
            f"coupled with low cumulative rainfall ({total_rain_period:.1f} mm) and a {max_dry_spell}-day dry sequence."
        )
    elif level == "moderate":
        explanation = (
            f"Moderate soil dryness: root-zone wetness is at {moist_pct}%. Low rainfall frequency requires "
            f"close monitoring to prevent vegetative moisture stress in sensitive crops."
        )
    else:
        explanation = (
            f"Soil water profile is healthy ({moist_pct}% wetness) with adequate recent rainfall ({total_rain_period:.1f} mm). "
            f"Drought probability is minimal."
        )

    return {
        "risk_type": "drought",
        "name": "Drought Risk",
        "level": level,
        "score": score,
        "score_percent": int(round(score * 100)),
        "explanation": explanation,
        "recommended_action": cfg["actions"][level],
        "contributing_variables": {
            "root_zone_moisture": f"{moist_pct}%",
            "period_rainfall": f"{total_rain_period:.1f} mm",
            "consecutive_dry_days": max_dry_spell,
            "ambient_temperature": f"{temp_avg:.1f}°C",
            "relative_humidity": f"{humidity:.1f}%",
        },
    }


def evaluate_flood_risk(
    peak_daily_rain: float,
    cumulative_3day_rain: float,
    soil_saturation: float,
    humidity: float,
) -> Dict[str, Any]:
    """
    Calculates flood / waterlogging risk score (0.0 to 1.0).
    """
    cfg = FLOOD_THRESHOLDS
    weights = cfg["weights"]

    # 1. Single-day intensity subscore
    if peak_daily_rain >= cfg["daily_rain_extreme_mm"]:
        s_daily = 1.0
    elif peak_daily_rain >= cfg["daily_rain_heavy_mm"]:
        s_daily = 0.65
    elif peak_daily_rain >= 15.0:
        s_daily = 0.35
    else:
        s_daily = 0.08

    # 2. Cumulative 3-day rainfall subscore
    if cumulative_3day_rain >= cfg["cumulative_3day_extreme_mm"]:
        s_cum = 1.0
    elif cumulative_3day_rain >= cfg["cumulative_3day_heavy_mm"]:
        s_cum = 0.70
    elif cumulative_3day_rain >= 30.0:
        s_cum = 0.35
    else:
        s_cum = 0.05

    # 3. Soil saturation subscore
    if soil_saturation >= cfg["soil_saturation_critical"]:
        s_sat = 1.0
    elif soil_saturation >= cfg["soil_saturation_elevated"]:
        s_sat = 0.60
    elif soil_saturation >= 0.50:
        s_sat = 0.25
    else:
        s_sat = 0.05

    # Composite Score
    score = round(
        weights["daily_intensity"] * s_daily +
        weights["cumulative_rainfall"] * s_cum +
        weights["soil_saturation"] * s_sat,
        2
    )
    score = max(0.05, min(0.98, score))
    level = _determine_risk_tier(score)

    sat_pct = round(soil_saturation * 100, 1)
    if level == "high":
        explanation = (
            f"Severe waterlogging alert: peak daily precipitation reached {peak_daily_rain:.1f} mm with "
            f"{cumulative_3day_rain:.1f} mm over 3 days, supersaturating root zones at {sat_pct}%."
        )
    elif level == "moderate":
        explanation = (
            f"Elevated soil saturation ({sat_pct}%) following {cumulative_3day_rain:.1f} mm rain over 3 days. "
            f"Upland crops (potato, maize) require drainage observation to prevent hypoxia."
        )
    else:
        explanation = (
            f"Controlled water absorption: peak daily rainfall ({peak_daily_rain:.1f} mm) and soil wetness ({sat_pct}%) "
            f"remain comfortably within regional drainage capacity."
        )

    return {
        "risk_type": "flood",
        "name": "Flood & Excess Rain Risk",
        "level": level,
        "score": score,
        "score_percent": int(round(score * 100)),
        "explanation": explanation,
        "recommended_action": cfg["actions"][level],
        "contributing_variables": {
            "peak_daily_rainfall": f"{peak_daily_rain:.1f} mm",
            "cumulative_3day_rain": f"{cumulative_3day_rain:.1f} mm",
            "soil_saturation": f"{sat_pct}%",
            "atmospheric_humidity": f"{humidity:.1f}%",
        },
    }


def evaluate_heat_stress_risk(
    temp_max: float,
    temp_avg: float,
    humidity: float,
    solar_rad: float,
) -> Dict[str, Any]:
    """
    Calculates thermal stress risk score (0.0 to 1.0).
    """
    cfg = HEAT_STRESS_THRESHOLDS
    weights = cfg["weights"]

    # 1. Max Temperature subscore
    if temp_max >= cfg["temp_max_extreme"]:
        s_tmax = 1.0
    elif temp_max >= cfg["temp_max_high"]:
        s_tmax = 0.70
    elif temp_max >= cfg["temp_max_moderate"]:
        s_tmax = 0.35
    else:
        s_tmax = 0.08

    # 2. Heat index subscore
    heat_index = _compute_heat_index(temp_max, humidity)
    if heat_index >= cfg["heat_index_extreme"]:
        s_hi = 1.0
    elif heat_index >= cfg["heat_index_moderate"]:
        s_hi = 0.65
    elif heat_index >= 32.0:
        s_hi = 0.30
    else:
        s_hi = 0.05

    # 3. Solar irradiance subscore (kWh/m²/day)
    if solar_rad >= 20.0:
        s_solar = 0.85
    elif solar_rad >= 16.0:
        s_solar = 0.50
    else:
        s_solar = 0.15

    # Composite Score
    score = round(
        weights["max_temperature"] * s_tmax +
        weights["heat_index"] * s_hi +
        weights["solar_irradiance"] * s_solar,
        2
    )
    score = max(0.05, min(0.98, score))
    level = _determine_risk_tier(score)

    if level == "high":
        explanation = (
            f"Extreme thermal stress: ambient peak reached {temp_max:.1f}°C (perceived heat index {heat_index:.1f}°C). "
            f"Elevated risk of reproductive floret sterility and leaf scorch."
        )
    elif level == "moderate":
        explanation = (
            f"Warm thermal conditions: maximum daytime temperature at {temp_max:.1f}°C with heat index of {heat_index:.1f}°C. "
            f"C3 rabi crops may experience elevated transpiration rates."
        )
    else:
        explanation = (
            f"Benign thermal regime: peak temperatures ({temp_max:.1f}°C) and heat index ({heat_index:.1f}°C) "
            f"are physiologically safe across target agro-ecological zones."
        )

    return {
        "risk_type": "heat_stress",
        "name": "Heat Stress Risk",
        "level": level,
        "score": score,
        "score_percent": int(round(score * 100)),
        "explanation": explanation,
        "recommended_action": cfg["actions"][level],
        "contributing_variables": {
            "max_temperature": f"{temp_max:.1f}°C",
            "average_temperature": f"{temp_avg:.1f}°C",
            "perceived_heat_index": f"{heat_index:.1f}°C",
            "solar_irradiance": f"{solar_rad:.1f} kWh/m²/day",
            "relative_humidity": f"{humidity:.1f}%",
        },
    }


async def assess_climate_risks_for_district(
    district: str = "bogura",
    start: Optional[date] = None,
    end: Optional[date] = None,
    temp_max_override: Optional[float] = None,
    precip_override: Optional[float] = None,
    soil_moisture_override: Optional[float] = None,
    humidity_override: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Main entry point: fetches NASA POWER telemetry and computes complete
    climate risk intelligence for Drought, Flood, and Heat Stress.
    """
    norm_dist = district.lower().strip()
    if norm_dist not in DISTRICT_COORDS:
        norm_dist = "bogura"

    # Fetch NASA data (past 20-30 days period)
    nasa_res = await fetch_nasa_power_data(district=norm_dist, start=start, end=end)
    records = nasa_res.get("data", [])

    # Extract observed metrics
    temps_max = [r["temp_max"] for r in records if r.get("temp_max") is not None]
    temps_avg = [r["temp_avg"] for r in records if r.get("temp_avg") is not None]
    precips = [r["precipitation"] for r in records if r.get("precipitation") is not None]
    humidities = [r["humidity"] for r in records if r.get("humidity") is not None]
    soil_moists = [r["soil_moisture"] for r in records if r.get("soil_moisture") is not None]
    solar_rads = [r["solar_rad"] for r in records if r.get("solar_rad") is not None]

    # Baseline calculations from observations
    obs_temp_max = max(temps_max) if temps_max else 32.0
    obs_temp_avg = (sum(temps_avg) / len(temps_avg)) if temps_avg else 28.5
    obs_total_rain = sum(precips) if precips else 15.0
    obs_peak_rain = max(precips) if precips else 8.0
    obs_humidity = (sum(humidities) / len(humidities)) if humidities else 82.0
    obs_soil_moist = (sum(soil_moists) / len(soil_moists)) if soil_moists else 0.70
    obs_solar = (sum(solar_rads) / len(solar_rads)) if solar_rads else 15.5

    # 3-day max cumulative rain
    max_3day_rain = obs_peak_rain
    if len(precips) >= 3:
        for i in range(len(precips) - 2):
            window_sum = sum(precips[i:i+3])
            if window_sum > max_3day_rain:
                max_3day_rain = window_sum

    # Max consecutive dry days (< 1.0mm)
    max_dry_spell = 0
    cur_dry = 0
    for p in precips:
        if p < 1.0:
            cur_dry += 1
            if cur_dry > max_dry_spell:
                max_dry_spell = cur_dry
        else:
            cur_dry = 0

    # Apply simulation overrides if provided
    final_temp_max = temp_max_override if temp_max_override is not None else obs_temp_max
    final_temp_avg = (final_temp_max - 4.0) if temp_max_override is not None else obs_temp_avg
    final_soil_moist = soil_moisture_override if soil_moisture_override is not None else obs_soil_moist
    if final_soil_moist > 1.0:
        final_soil_moist = final_soil_moist / 100.0  # normalize if 0-100 given
    final_humidity = humidity_override if humidity_override is not None else obs_humidity

    if precip_override is not None:
        final_peak_rain = precip_override
        final_total_rain = precip_override * 3.0
        final_3day_rain = precip_override * 2.5
    else:
        final_peak_rain = obs_peak_rain
        final_total_rain = obs_total_rain
        final_3day_rain = max_3day_rain

    # Evaluate the three risks
    drought_res = evaluate_drought_risk(
        soil_moisture=final_soil_moist,
        total_rain_period=final_total_rain,
        max_dry_spell=max_dry_spell,
        temp_avg=final_temp_avg,
        humidity=final_humidity,
    )

    flood_res = evaluate_flood_risk(
        peak_daily_rain=final_peak_rain,
        cumulative_3day_rain=final_3day_rain,
        soil_saturation=final_soil_moist,
        humidity=final_humidity,
    )

    heat_res = evaluate_heat_stress_risk(
        temp_max=final_temp_max,
        temp_avg=final_temp_avg,
        humidity=final_humidity,
        solar_rad=obs_solar,
    )

    all_risks = [drought_res, flood_res, heat_res]

    # Overall risk level
    scores = [r["score"] for r in all_risks]
    max_score = max(scores)
    overall_level = _determine_risk_tier(max_score)

    display_name = norm_dist.replace("bogra", "bogura").title()

    return {
        "district": norm_dist,
        "display_name": display_name,
        "assessment_period": {
            "start": nasa_res.get("start_date", str(date.today() - timedelta(days=33))),
            "end": nasa_res.get("end_date", str(date.today() - timedelta(days=3))),
            "days_analyzed": len(records),
        },
        "engine": "rule_based_risk_matrix",
        "engine_name": "NASA POWER Agroclimatic Threshold Matrix (BARC/BMD Aligned)",
        "is_ai_model": False,
        "overall_risk_level": overall_level,
        "overall_risk_score": round(max_score, 2),
        "risks": all_risks,
    }
