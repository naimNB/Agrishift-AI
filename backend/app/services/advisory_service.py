"""
advisory_service.py — Deterministic Farmer Advisory Engine
==========================================================
Generates actionable, explainable agronomic advisories across 5 core categories:
1. Irrigation (সেচ পরামর্শ)
2. Crop Selection (ফসল নির্বাচন)
3. Heat Protection (তাপপ্রবাহ ও খরা সুরক্ষা)
4. Excess Rainfall / Flood Preparation (অতিরিক্ত বৃষ্টি ও বন্যা প্রস্তুতি)
5. Sowing Timing (বপন ও রোপণ সময়সূচী)

Synthesizes:
- NASA POWER daily agroclimate telemetry
- Multi-crop ranking engine results
- Climate risk intelligence results (Drought, Flood, Heat Stress)

Supports both English and Bangla message structures without requiring external LLM APIs.
"""

from datetime import date, timedelta
from typing import Optional, Dict, Any, List

from app.services.nasa_service import fetch_nasa_power_data, DISTRICT_COORDS
from app.services.prediction_service import rank_crops_rule_based, CROP_METADATA
from app.services.climate_risk_service import assess_climate_risks_for_district


def generate_irrigation_advisory(
    soil_moisture: float,
    precip_recent: float,
    drought_risk_level: str,
    temp_avg: float,
) -> Dict[str, Any]:
    """
    Evaluates root-zone moisture and drought threat to produce irrigation directives.
    """
    moist_pct = round(soil_moisture * 100, 1)

    if soil_moisture >= 0.65 and drought_risk_level == "low":
        title = "Irrigation Management"
        title_bn = "সেচ ব্যবস্থাপনা পরামর্শ"
        message = (
            f"Soil moisture is currently adequate ({moist_pct}% wetness); "
            "avoid unnecessary irrigation to conserve groundwater."
        )
        message_bn = (
            f"মাটির আর্দ্রতা বর্তমানে সন্তোষজনক ({moist_pct}%); "
            "অপ্রয়োজনীয় সেচ পরিহার করে ভূগর্ভস্থ পানি ও বিদ্যুৎ সাশ্রয় করুন।"
        )
        priority = "routine"
    elif soil_moisture >= 0.45 and drought_risk_level != "high":
        title = "Supplemental Irrigation"
        title_bn = "পরিমিত সম্পূরক সেচ"
        message = (
            f"Soil moisture is moderate ({moist_pct}%). Schedule light irrigation if cultivating "
            "shallow-rooted upland crops (maize, mustard) or apply Alternate Wetting and Drying (AWD) in rice."
        )
        message_bn = (
            f"মাটিতে আর্দ্রতার পরিমাণ মধ্যম পর্যায়ে রয়েছে ({moist_pct}%)। ভুট্টা, সরিষা বা রোপা ধানের জমিতে "
            "প্রয়োজন অনুযায়ী হালকা সেচ বা পর্যায়ক্রমিক ভেজানো-শুকানো (AWD) পদ্ধতি অনুসরণ করুন।"
        )
        priority = "actionable"
    else:
        title = "Urgent Soil Irrigation Required"
        title_bn = "জরুরি সেচ প্রয়োগ প্রয়োজন"
        message = (
            f"Soil moisture deficit detected ({moist_pct}% wetness, drought risk: {drought_risk_level}). "
            "Initiate immediate supplemental irrigation to prevent vegetative wilting and yield loss."
        )
        message_bn = (
            f"মাটিতে পানিস্বল্পতা দেখা দিয়েছে ({moist_pct}% আর্দ্রতা, খরা ঝুঁকি: {drought_risk_level})। "
            "ফসলের পাতা শুকিয়ে যাওয়া ও ফলন বিপর্যয় রোধে দ্রুত সেচ নিশ্চিত করুন।"
        )
        priority = "urgent"

    return {
        "category": "irrigation",
        "title": title,
        "title_bn": title_bn,
        "message": message,
        "message_bn": message_bn,
        "priority": priority,
        "icon": "droplets",
        "context_metrics": {
            "soil_moisture": f"{moist_pct}%",
            "recent_rainfall": f"{precip_recent:.1f} mm",
            "drought_risk_tier": drought_risk_level.title(),
        },
    }


def generate_crop_selection_advisory(
    best_crop: Dict[str, Any],
    runner_up: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluates top candidate crops from the physiological ranking engine.
    """
    crop_name_en = best_crop["display_name"]
    crop_score_pct = int(round(best_crop["score"] * 100))
    meta = CROP_METADATA.get(best_crop["crop"], CROP_METADATA["rice"])
    bn_name = meta["bengali_name"]

    message = (
        f"{crop_name_en} currently has the highest suitability score ({crop_score_pct}% compatibility). "
        f"Well-adapted to regional soil wetness and seasonal temperatures."
    )
    message_bn = (
        f"বর্তমান আবহাওয়া ও মাটির অবস্থায় {bn_name} চাষের অনুকূলতা সবচেয়ে বেশি ({crop_score_pct}%)। "
        "উন্নত জাত ও সুস্থ চারা/বীজ নির্বাচন করে চাষাবাদ নিশ্চিত করুন।"
    )

    if runner_up:
        r_name = runner_up["display_name"]
        r_score = int(round(runner_up["score"] * 100))
        message += f" Strong secondary alternative: {r_name} ({r_score}%)."
        message_bn += f" বিকল্প হিসেবে {runner_up.get('crop', '').title()} বিবেচনা করা যেতে পারে ({r_score}%)।"

    return {
        "category": "crop_selection",
        "title": "Optimal Crop Selection",
        "title_bn": "অনুকূল ফসল নির্বাচন",
        "message": message,
        "message_bn": message_bn,
        "priority": "actionable",
        "icon": "sprout",
        "context_metrics": {
            "recommended_crop": crop_name_en,
            "suitability_score": f"{crop_score_pct}%",
            "suitability_tier": best_crop.get("suitability", "High"),
        },
    }


def generate_heat_protection_advisory(
    temp_max: float,
    temp_avg: float,
    heat_risk_level: str,
    humidity: float,
) -> Dict[str, Any]:
    """
    Evaluates daytime temperature spikes and heat stress vulnerability.
    """
    if heat_risk_level == "high" or temp_max >= 35.0:
        title = "Severe Heatwave & Canopy Stress Alert"
        title_bn = "তীব্র তাপপ্রবাহ ও ক্যানোপি সুরক্ষা সতর্কতা"
        message = (
            f"High temperature ({temp_max:.1f}°C) may cause severe heat stress and spike evapotranspiration. "
            "Apply light evening irrigation to cool root zones, avoid midday pesticide spraying, and spray 1% potassium to strengthen cell turgor."
        )
        message_bn = (
            f"তীব্র তাপমাত্রা ({temp_max:.1f}°C) ফসলে তাপীয় চাপ তৈরি করতে পারে। "
            "দুপুরে রাসায়নিক স্প্রে বন্ধ রাখুন, বিকেলে হালকা সেচ দিয়ে ক্যানোপি ঠান্ডা রাখুন এবং পটাশ স্প্রে করুন।"
        )
        priority = "urgent"
    elif heat_risk_level == "moderate" or temp_max >= 31.0:
        title = "Midday Heat Protection"
        title_bn = "দুপুরের তাপপ্রবাহ থেকে সুরক্ষা"
        message = (
            f"High temperature may cause heat stress during midday ({temp_max:.1f}°C peak). "
            "Maintain 3–5 cm water depth in rice paddies and inspect C3 rabi crops for leaf curling."
        )
        message_bn = (
            f"দুপুরে তাপমাত্রা বৃদ্ধির কারণে ({temp_max:.1f}°C) ফসলে মৃদু তাপীয় চাপ তৈরি হতে পারে। "
            "জমিতে সামান্য আর্দ্রতা বজায় রাখুন এবং পাতা কুঁকড়ে যাওয়া পর্যবেক্ষণ করুন।"
        )
        priority = "actionable"
    else:
        title = "Thermal Regime Normal"
        title_bn = "তাপমাত্রার অবস্থা স্বাভাবিক"
        message = (
            f"Daytime temperature ({temp_max:.1f}°C peak) is within comfortable physiological limits. "
            "No active heat protection measures required."
        )
        message_bn = (
            f"দিনের তাপমাত্রা স্বাভাবিক ও সহনীয় সীমার মধ্যে রয়েছে ({temp_max:.1f}°C)। "
            "কোনো বিশেষ তাপ সুরক্ষার প্রয়োজন নেই।"
        )
        priority = "routine"

    return {
        "category": "heat_protection",
        "title": title,
        "title_bn": title_bn,
        "message": message,
        "message_bn": message_bn,
        "priority": priority,
        "icon": "thermometer",
        "context_metrics": {
            "max_temperature": f"{temp_max:.1f}°C",
            "average_temperature": f"{temp_avg:.1f}°C",
            "heat_risk_tier": heat_risk_level.title(),
        },
    }


def generate_excess_rainfall_advisory(
    flood_risk_level: str,
    peak_daily_rain: float,
    soil_moisture: float,
) -> Dict[str, Any]:
    """
    Evaluates heavy precipitation and waterlogging risks.
    """
    sat_pct = round(soil_moisture * 100, 1)

    if flood_risk_level == "high" or peak_daily_rain >= 50.0:
        title = "Excess Rainfall & Waterlogging Alert"
        title_bn = "অতিরিক্ত বৃষ্টি ও জলাবদ্ধতা সতর্কতা"
        message = (
            f"High precipitation alert (peak {peak_daily_rain:.1f} mm/day, soil saturation {sat_pct}%). "
            "Clear field drainage channels immediately, open furrow outlets in upland crops (potato/maize), and postpone fertilizer top-dressing."
        )
        message_bn = (
            f"ভারী বৃষ্টি ও জলাবদ্ধতার উচ্চ ঝুঁকি (সর্বোচ্চ {peak_daily_rain:.1f} মিমি, স্যাচুরেশন {sat_pct}%)। "
            "দ্রুত জমির নিকাশ নালা পরিষ্কার করুন এবং ইউরিয়া সার প্রয়োগ সাময়িক স্থগিত রাখুন।"
        )
        priority = "urgent"
    elif flood_risk_level == "moderate" or peak_daily_rain >= 25.0:
        title = "Rainfall & Drainage Preparation"
        title_bn = "বৃষ্টিপাত ও পানি নিষ্কাশন প্রস্তুতি"
        message = (
            f"Moderate rainfall observed ({peak_daily_rain:.1f} mm peak). "
            "Inspect field perimeter bunds to ensure excess surface water can drain freely without lodging crops."
        )
        message_bn = (
            f"মাঝারি বৃষ্টিপাত পরিলক্ষিত হয়েছে ({peak_daily_rain:.1f} মিমি)। "
            "জমির আইল ও ড্রেনেজ পথ খোলা রাখুন যাতে অতিরিক্ত পানি সহজে নেমে যেতে পারে।"
        )
        priority = "actionable"
    else:
        title = "Drainage Status Favorable"
        title_bn = "পানি নিষ্কাশন অবস্থা অনুকূল"
        message = (
            "Precipitation levels remain low and soil absorption is normal. No waterlogging risks detected."
        )
        message_bn = (
            "বৃষ্টিপাতের পরিমাণ স্বাভাবিক ও নিয়ন্ত্রণে রয়েছে; জলাবদ্ধতার কোনো তাৎক্ষণিক ঝুঁকি নেই।"
        )
        priority = "routine"

    return {
        "category": "excess_rainfall",
        "title": title,
        "title_bn": title_bn,
        "message": message,
        "message_bn": message_bn,
        "priority": priority,
        "icon": "cloud_rain",
        "context_metrics": {
            "peak_daily_rain": f"{peak_daily_rain:.1f} mm",
            "soil_saturation": f"{sat_pct}%",
            "flood_risk_tier": flood_risk_level.title(),
        },
    }


def generate_sowing_timing_advisory(
    best_crop: Dict[str, Any],
    temp_avg: float,
    soil_moisture: float,
) -> Dict[str, Any]:
    """
    Evaluates sowing schedule and seasonal window for target crop.
    """
    meta = CROP_METADATA.get(best_crop["crop"], CROP_METADATA["rice"])
    sowing_window = meta["sowing_period"]
    bn_name = meta["bengali_name"]

    message = (
        f"Recommended sowing window for {best_crop['display_name']}: {sowing_window}. "
        "Prepare seedbeds with certified foundation seeds; ensure field moisture is stabilized before direct seeding."
    )
    message_bn = (
        f"{bn_name} এর জন্য উপযুক্ত বপন সময়কাল: {sowing_window}। "
        "অনুকূল আর্দ্রতায় জমি তৈরি করুন এবং প্রত্যয়িত বীজ ব্যবহার করে চারা রোপণ সম্পন্ন করুন।"
    )

    return {
        "category": "sowing_timing",
        "title": "Sowing & Planting Window",
        "title_bn": "বপন ও রোপণ সময়সূচী",
        "message": message,
        "message_bn": message_bn,
        "priority": "actionable",
        "icon": "calendar",
        "context_metrics": {
            "target_crop": best_crop["display_name"],
            "recommended_window": sowing_window,
            "soil_moisture_level": f"{round(soil_moisture*100, 1)}%",
        },
    }


async def generate_farmer_advisories_for_district(
    district: str = "bogura",
    crop: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Orchestrates telemetry, crop ranking, and risk assessment into a unified
    actionable advisory feed.
    """
    norm_dist = district.lower().strip()
    if norm_dist not in DISTRICT_COORDS:
        norm_dist = "bogura"

    # 1. Fetch Risk Assessment (which integrates NASA telemetry)
    risk_assessment = await assess_climate_risks_for_district(district=norm_dist)
    risks_by_type = {r["risk_type"]: r for r in risk_assessment.get("risks", [])}

    drought_info = risks_by_type.get("drought", {})
    flood_info = risks_by_type.get("flood", {})
    heat_info = risks_by_type.get("heat_stress", {})

    drought_level = drought_info.get("level", "low")
    flood_level = flood_info.get("level", "low")
    heat_level = heat_info.get("level", "low")

    # 2. Extract telemetry snapshot for crop ranking
    # Fetch recent telemetry
    nasa_data = await fetch_nasa_power_data(district=norm_dist)
    records = nasa_data.get("data", [])

    temps_avg = [r["temp_avg"] for r in records if r.get("temp_avg") is not None]
    temps_max = [r["temp_max"] for r in records if r.get("temp_max") is not None]
    precips = [r["precipitation"] for r in records if r.get("precipitation") is not None]
    humidities = [r["humidity"] for r in records if r.get("humidity") is not None]
    soil_moists = [r["soil_moisture"] for r in records if r.get("soil_moisture") is not None]
    solar_rads = [r["solar_rad"] for r in records if r.get("solar_rad") is not None]

    avg_temp = (sum(temps_avg) / len(temps_avg)) if temps_avg else 28.5
    max_temp = max(temps_max) if temps_max else 34.0
    avg_precip = (sum(precips) / len(precips)) if precips else 5.0
    peak_precip = max(precips) if precips else 12.0
    avg_humidity = (sum(humidities) / len(humidities)) if humidities else 82.0
    avg_soil_moist = (sum(soil_moists) / len(soil_moists)) if soil_moists else 0.72
    avg_solar = (sum(solar_rads) / len(solar_rads)) if solar_rads else 15.5

    # 3. Evaluate Crop Rankings
    ranking_res = rank_crops_rule_based(
        location=norm_dist,
        temp_avg=avg_temp,
        precipitation=avg_precip,
        humidity=avg_humidity,
        soil_moisture=avg_soil_moist,
        solar_rad=avg_solar,
    )
    recommendations = ranking_res.get("recommendations", [])
    best_crop = recommendations[0] if recommendations else {
        "crop": "rice",
        "display_name": "Rice (ধান)",
        "score": 0.90,
        "suitability": "High",
        "sowing_period": "June–July (T. Aman) / Nov–Dec (Boro)",
    }
    runner_up = recommendations[1] if len(recommendations) > 1 else None

    # If specific crop was requested by user, find it
    if crop:
        matched = next((r for r in recommendations if r["crop"] == crop.lower().strip()), None)
        if matched:
            best_crop = matched

    # 4. Generate the 5 Actionable Advisory Items
    advisory_irrigation = generate_irrigation_advisory(
        soil_moisture=avg_soil_moist,
        precip_recent=sum(precips[-7:]) if len(precips) >= 7 else avg_precip * 7,
        drought_risk_level=drought_level,
        temp_avg=avg_temp,
    )

    advisory_crop = generate_crop_selection_advisory(
        best_crop=best_crop,
        runner_up=runner_up,
    )

    advisory_heat = generate_heat_protection_advisory(
        temp_max=max_temp,
        temp_avg=avg_temp,
        heat_risk_level=heat_level,
        humidity=avg_humidity,
    )

    advisory_flood = generate_excess_rainfall_advisory(
        flood_risk_level=flood_level,
        peak_daily_rain=peak_precip,
        soil_moisture=avg_soil_moist,
    )

    advisory_sowing = generate_sowing_timing_advisory(
        best_crop=best_crop,
        temp_avg=avg_temp,
        soil_moisture=avg_soil_moist,
    )

    all_advisories = [
        advisory_irrigation,
        advisory_crop,
        advisory_heat,
        advisory_flood,
        advisory_sowing,
    ]

    # Current seasonal context description
    today_month = date.today().month
    if today_month in [11, 12, 1, 2]:
        season_context = "Rabi (Winter Dry Season / গম, আলু, সরিষা মৌসুম)"
    elif today_month in [3, 4, 5]:
        season_context = "Kharif-1 (Pre-Monsoon / আউশ, পাট, বোরো পাকা মৌসুম)"
    else:
        season_context = "Kharif-2 (Monsoon / রোপা আমন মৌসুম)"

    display_name = norm_dist.replace("bogra", "bogura").title()

    return {
        "district": norm_dist,
        "display_name": display_name,
        "assessment_date": str(date.today()),
        "season_context": season_context,
        "engine": "deterministic_farmer_advisory_engine",
        "engine_name": "AgriShift Rule-Based Advisory Layer (BARC / DAE Aligned)",
        "is_ai_model": False,
        "advisories": all_advisories,
        "top_recommended_crop": {
            "crop": best_crop.get("crop", "rice"),
            "display_name": best_crop.get("display_name", "Rice (ধান)"),
            "score": best_crop.get("score", 0.90),
            "suitability": best_crop.get("suitability", "High"),
            "sowing_period": best_crop.get("sowing_period", "June–July (T. Aman)"),
        },
        "regional_climate_summary": {
            "avg_temp": round(avg_temp, 1),
            "max_temp": round(max_temp, 1),
            "soil_moisture": round(avg_soil_moist * 100, 1),
            "avg_humidity": round(avg_humidity, 1),
            "peak_daily_rain": round(peak_precip, 1),
        },
    }
