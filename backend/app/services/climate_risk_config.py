"""
climate_risk_config.py — Climate Risk Intelligence Thresholds & Config
=====================================================================
Configurable thresholds, weights, and agronomic guidelines for evaluating:
1. Drought Risk
2. Flood / Excess Rainfall Risk
3. Heat Stress Risk

Thresholds are formulated as Bangladesh-oriented agronomic prototype rules.
"""

from typing import Dict, Any

# ─────────────────────────────────────────────────────────────────────────────
# 1. DROUGHT RISK CONFIG
# ─────────────────────────────────────────────────────────────────────────────
# Evaluates soil water deficit, prolonged lack of rain, and high evaporative demand.
# Barind Tract (Rajshahi/Dinajpur) has lower water retention capacity.
DROUGHT_THRESHOLDS = {
    # Root-zone soil moisture (fraction 0.0 - 1.0)
    "soil_moisture_severe": 0.30,     # Below 30% is severe moisture stress
    "soil_moisture_moderate": 0.45,   # 30% - 45% is moderate stress
    "soil_moisture_safe": 0.60,       # Above 60% is field capacity/safe for paddy

    # 14-day cumulative precipitation (mm)
    "precip_14day_severe_mm": 10.0,   # Less than 10mm in 2 weeks
    "precip_14day_moderate_mm": 25.0, # 10mm - 25mm in 2 weeks
    "dry_spell_days_severe": 12,      # Consecutive days with < 1.0mm rain
    "dry_spell_days_moderate": 7,

    # Scoring Weights
    "weights": {
        "soil_moisture": 0.45,
        "rainfall_deficit": 0.35,
        "evaporative_demand": 0.20,
    },

    # Recommended Actions
    "actions": {
        "high": (
            "Initiate immediate supplemental tubewell irrigation; adopt Alternate Wetting and Drying (AWD) "
            "to conserve aquifer supply; apply straw mulching around non-paddy row crops."
        ),
        "moderate": (
            "Monitor soil profile moisture closely; schedule light irrigation before critical reproductive "
            "stages (panicle initiation / flowering); minimize weed competition for water."
        ),
        "low": (
            "Soil hydration is adequate; maintain routine seasonal irrigation schedules and monitor weekly NASA telemetry."
        ),
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. FLOOD / EXCESS RAINFALL RISK CONFIG
# ─────────────────────────────────────────────────────────────────────────────
# Evaluates waterlogging, torrential precipitation, and saturated root zones.
# Tista and Jamuna river basins (Rangpur, Bogura) are prone to pre-monsoon flash floods.
FLOOD_THRESHOLDS = {
    # Single-day rainfall intensity (mm/day)
    "daily_rain_extreme_mm": 65.0,    # Cloudburst / torrential downpour
    "daily_rain_heavy_mm": 35.0,      # Heavy precipitation

    # 3-day cumulative rainfall (mm)
    "cumulative_3day_extreme_mm": 120.0,
    "cumulative_3day_heavy_mm": 70.0,

    # Root-zone soil saturation (fraction 0.0 - 1.0)
    "soil_saturation_critical": 0.88,  # > 88% causes root hypoxia in upland crops
    "soil_saturation_elevated": 0.75,

    # Scoring Weights
    "weights": {
        "daily_intensity": 0.35,
        "cumulative_rainfall": 0.35,
        "soil_saturation": 0.30,
    },

    # Recommended Actions
    "actions": {
        "high": (
            "Immediately open perimeter drainage channels and clear field ditches; suspend nitrogen top-dressing "
            "to prevent nutrient runoff; prepare raised beds or bund reinforcement for upland crops."
        ),
        "moderate": (
            "Check field drainage exits; ensure water level in aman paddy fields does not exceed 10–12 cm; "
            "delay planned pesticide spraying until dry weather stabilizes."
        ),
        "low": (
            "Normal moisture drainage; surface runoff is safely within soil infiltration capacity."
        ),
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. HEAT STRESS RISK CONFIG
# ─────────────────────────────────────────────────────────────────────────────
# Evaluates canopy thermal inhibition, flower sterility, and high humidex.
# Critical for wheat/potato during Rabi (late Feb–March) and boro rice flowering (April).
HEAT_STRESS_THRESHOLDS = {
    # Maximum ambient temperature (°C)
    "temp_max_extreme": 37.0,         # Severe heatwave / pollen desiccation threshold
    "temp_max_high": 34.0,            # High thermal stress for temperate/C3 crops
    "temp_max_moderate": 31.0,        # Moderate stress

    # Humidex / combined heat index (°C)
    "heat_index_extreme": 42.0,
    "heat_index_moderate": 36.0,

    # Scoring Weights
    "weights": {
        "max_temperature": 0.50,
        "heat_index": 0.30,
        "solar_irradiance": 0.20,
    },

    # Recommended Actions
    "actions": {
        "high": (
            "Apply frequent light evening irrigations to cool root microclimate; apply 1% potassium nitrate (KNO3) "
            "or zinc foliar spray to strengthen cellular membrane stability; avoid midday chemical applications."
        ),
        "moderate": (
            "Maintain standing water (3–5 cm) in rice paddies to buffer daytime heat spikes; inspect potato "
            "tubers and rabi crops for premature canopy senescence."
        ),
        "low": (
            "Thermal conditions are well within comfortable physiological ranges for regional crops."
        ),
    },
}

# Master config lookup
RISK_CONFIG_REGISTRY: Dict[str, Any] = {
    "drought": DROUGHT_THRESHOLDS,
    "flood": FLOOD_THRESHOLDS,
    "heat_stress": HEAT_STRESS_THRESHOLDS,
}
