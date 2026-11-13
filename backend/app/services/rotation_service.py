"""
rotation_service.py — Data-Driven, Explainable Crop Rotation Decision Engine
============================================================================
Grounded in authoritative Bangladeshi agricultural research:
1. Bangladesh Agricultural Research Council (BARC) Agro-Ecological Zones (AEZ) & Fertilizer Recommendation Guide (FRG-2018)
2. Bangladesh Agricultural Research Institute (BARI) Handbook on Agricultural Technologies (Krishi Projukti Hatboi, 8th Ed., 2019)
3. Bangladesh Rice Research Institute (BRRI) Modern Rice Cultivation (Adhunik Dhaner Chash, 24th Ed., 2020)
4. Department of Agricultural Extension (DAE) National Crop Calendars & Krishi Diary
5. Bangladesh Jute Research Institute (BJRI) Tossho Jute Production Guidelines
6. NASA POWER Daily Agroclimatology (Earth Observation historical telemetry, RETS & GMAO MERRA-2)

Strict Scientific Standards:
- Explicitly rejects unviable combinations (e.g., continuous flooded Boro rice without assured irrigation).
- Separates historical satellite observations from forecasts; does not fabricate synthetic fallback telemetry.
- Evaluates genuine agro-ecological responses across district, season, current crop, soil texture, and irrigation.
- Clearly documents heuristic multi-criteria weights vs. empirical physiological thresholds.
"""

from datetime import date, timedelta
from typing import Dict, Any, List, Optional
import math

from app.schemas.rotation import (
    CropRotationRequest,
    RotationPlanItem,
    CropRotationResponse,
)
from app.services.nasa_service import fetch_nasa_power_data, get_summary_stats, DISTRICT_COORDS


# ── Authoritative Bangladesh Cropping Pattern Knowledge Base ──────────────────

CROPPING_PATTERNS_DATABASE = [
    {
        "id": "pattern_aman_potato_maize",
        "title_bn": "অর্থকরী ও খরা সহনশীল আবর্তন (আমন → আলু → ভুট্টা)",
        "title_en": "High-Value Resilient Cycle (T. Aman → Potato → Hybrid Maize)",
        "sequence_bn": "রোপা আমন ধান  ➔  আলু  ➔  হাইব্রিড ভুট্টা",
        "sequence_en": "T. Aman Rice  ➔  Potato  ➔  Hybrid Maize",
        "crops": ["rice", "potato", "maize"],
        "seasons": ["kharif-2", "rabi", "kharif-1"],
        "duration_days": {
            "rice": 115,    # Short duration T. Aman (BRRI dhan75: 110-115d / BRRI dhan87: 120d)
            "potato": 90,   # BARI Alu-7 (Diamant: 85-90d) / BARI Alu-8
            "maize": 130,   # Rabi hybrid maize (BARI Hybrid Maize-9: 130-135d)
        },
        "water_intensity": "moderate",
        "irrigation_required": True,
        "ideal_soils": ["sandy_loam", "loam", "silt_loam"],
        "unfavorable_soils": ["heavy_clay", "clay"],
        "diversity_score": 95,
        "why_suitable_bn": (
            "উত্তরবঙ্গের প্রধান কৃষি হাবসমূহে (বগুড়া, রংপুর, দিনাজপুর) আলু অত্যন্ত লাভজনক অর্থকরী ফসল। "
            "গবেষণায় দেখা গেছে, প্রচলিত প্লাবিত বোরো ধানের (১০০০-১৪০০ মিমি) তুলনায় আলু ও ভুট্টার সমন্বিত সেচ চাহিদা "
            "প্রায় ৩০-৪০% কম হতে পারে (উৎস: BARI ও BARC AEZ গাইডলাইন)। "
            "আলু চাষের জমিতে প্রয়োগকৃত অবশিষ্টাংশ ফসফরাস ও পটাশ সার পরবর্তী গভীরমূলী ভুট্টা ফসল দক্ষতার সাথে গ্রহণ করে, "
            "ফলে রাসায়নিক সারের অপচয় ও খরচ হ্রাস পায়।"
        ),
        "why_suitable_en": (
            "A proven commercial cropping pattern for North Bengal floodplains (Bogura, Rangpur, Dinajpur). "
            "Consumes approximately 30-40% less irrigation volume compared to continuous flooded Boro rice (1000-1400 mm), "
            "reducing groundwater extraction. Deep-rooting hybrid maize scavenges residual phosphorus and potassium "
            "applied to potato, reducing input fertilizer expenditure (BARI & BARC guidelines)."
        ),
        "soil_benefit_bn": "আলু ও ভুট্টার শিকড় ব্যবস্থা মাটির ভিন্ন ভিন্ন গভীরতা থেকে পুষ্টি গ্রহণ করে মাটির গঠন ও অম্ল-ক্ষার ভারসাম্য বজায় রাখে।",
        "soil_benefit_en": "Alternating tuber and deep fibrous root architectures prevents sub-soil compaction and maximizes multi-layer nutrient extraction.",
        "water_regime_bn": "মাঝারি সেচ (আলুতে হালকা নালা সেচ এবং ভুট্টায় ৩-৪টি সম্পূরক সেচ)।",
        "water_regime_en": "Moderate irrigation (light furrow irrigation for potato, 3-4 scheduled supplemental irrigations for maize).",
        "risk_level_bn": "মাঝারি ঝুঁকি (শীতকালীন ঘন কুয়াশায় আলুর নাবি ধসা রোগ এবং উত্তোলনের সময় স্থানীয় বাজার দর যাচাই করা দরকার)।",
        "risk_level_en": "Moderate risk (monitor late blight vulnerability during foggy spells and local harvest market pricing).",
        "scientific_basis": "BARI Tuber Crops Research Centre (Krishi Projukti Hatboi, 2019) & BARC AEZ 3/4 Guidelines",
    },
    {
        "id": "pattern_aman_mustard_boro",
        "title_bn": "৩ ফসলি নিবিড় আবর্তন (আমন → সরিষা → বোরো ধান)",
        "title_en": "Triple-Crop Intensive Cycle (T. Aman → Mustard → Boro Rice)",
        "sequence_bn": "রোপা আমন ধান  ➔  স্বল্পমেয়াদী সরিষা  ➔  দেরিতে বপনযোগ্য বোরো ধান",
        "sequence_en": "T. Aman Rice  ➔  Short-duration Mustard  ➔  Boro Rice",
        "crops": ["rice", "mustard", "rice"],
        "seasons": ["kharif-2", "rabi_early", "rabi_late"],
        "duration_days": {
            "rice_aman": 115,  # Short duration T. Aman (BRRI dhan75: 110-115d)
            "mustard": 80,     # BARI Sarisha-14/15 (75-80d) / BARI Sarisha-17 (80-85d)
            "rice_boro": 145,  # Medium duration Boro (BRRI dhan28/88/96: 140-145d)
        },
        "water_intensity": "high", # Boro requires flooded tubewell/AWD irrigation
        "irrigation_required": True,
        "ideal_soils": ["loam", "clay_loam", "silt_loam"],
        "unfavorable_soils": ["coarse_sand"],
        "diversity_score": 88,
        "why_suitable_bn": (
            "আমন ধান কাটার পর এবং বোরো ধান লাগানোর মধ্যবর্তী ফাঁকা সময়ে (নভেম্বর-জানুয়ারি) মাত্র ৭৫-৮০ দিনে "
            "স্বল্পমেয়াদী সরিষা (বারি সরিষা-১৪/১৫/১৭) ঘরে তুলে বাড়তি তেলবীজ উৎপাদন ও নগদ আয় নিশ্চিত করা যায়। "
            "এটি দেশে ভোজ্যতেলের ঘাটতি পূরণে সহায়তা করে এবং বছরে একই জমিতে ৩টি সফল ফসল নিশ্চিত করে।"
        ),
        "why_suitable_en": (
            "Capitalizes on the 75-80 day window between Aman harvest and Boro transplanting using short-duration "
            "mustard (BARI Sarisha-14/15/17). Yields valuable domestic oilseed cash income without delaying Boro establishment."
        ),
        "soil_benefit_bn": "সরিষার শিকড় ও পাতা মাটিতে পচে জৈব পদার্থ বৃদ্ধি করে এবং আগাছার বংশবিস্তার রোধ করে।",
        "soil_benefit_en": "Mustard taproots incorporate organic biomass into topsoil and biologically suppress weed seed banks.",
        "water_regime_bn": "উচ্চ সেচ প্রয়োজন (সরিষায় ১টি হালকা সেচ এবং বোরো ধানে নিয়মিত নলকূপ/AWD সেচ)।",
        "water_regime_en": "High water regime (1 light irrigation for mustard, mandatory AWD/tubewell irrigation for Boro).",
        "risk_level_bn": "কম-মাঝারি ঝুঁকি (নভেম্বর ২০ এর মধ্যে সরিষা বপন না করলে পরবর্তী বোরো ধানের চারা রোপণ দেরিতে হতে পারে)।",
        "risk_level_en": "Low-to-moderate risk (requires timely mustard sowing before late November to avoid late Boro transplanting penalty).",
        "scientific_basis": "BRRI-BARI Collaborative 3-Crop Intensive Farming Protocol (Adhunik Dhaner Chash, 24th Ed.)",
    },
    {
        "id": "pattern_jute_aman_wheat",
        "title_bn": "বরেন্দ্র ও পানি সাশ্রয়ী আবর্তন (তোষা পাট → আমন → গম)",
        "title_en": "Barind Groundwater Conservation Cycle (Tossho Jute → T. Aman → Wheat)",
        "sequence_bn": "তোষা পাট  ➔  রোপা আমন ধান  ➔  তাপ সহনশীল গম",
        "sequence_en": "Tossho Jute  ➔  T. Aman Rice  ➔  Heat-Tolerant Wheat",
        "crops": ["jute", "rice", "wheat"],
        "seasons": ["kharif-1", "kharif-2", "rabi"],
        "duration_days": {
            "jute": 115,       # BJRI Tossho Pat-8 (Robi-1: 110-120d)
            "rice": 120,       # BRRI dhan87 (120-125d)
            "wheat": 105,      # BARI Gom-33 / WMRI Gom-1 (100-110d)
        },
        "water_intensity": "low_to_moderate",
        "irrigation_required": False, # Wheat needs only 2-3 light irrigations; jute & Aman are primarily rainfed
        "ideal_soils": ["loam", "clay_loam", "silt_loam"],
        "unfavorable_soils": ["waterlogged_basin"],
        "diversity_score": 92,
        "why_suitable_bn": (
            "উচ্চ বরেন্দ্র ও শুষ্ক উত্তরাঞ্চলে ভূগর্ভস্থ পানির সংকট রোধে এটি একটি পরীক্ষিত টেকসই শস্যচক্র। "
            "বিজেআরআই (BJRI) ও বারি (BARI) গবেষণা অনুসারে, গমে মাত্র ২-৩টি সম্পূরক সেচ (১৫০-২৫০ মিমি) প্রয়োজন হওয়ায় "
            "প্লাবিত বোরো ধানের তুলনায় প্রায় ৬০-৭০% ভূগর্ভস্থ পানি সাশ্রয় সম্ভব। "
            "এছাড়া পাটের ঝরে পড়া পাতা হেক্টরপ্রতি ১.৫-২.৫ টন জৈব পদার্থ যোগ করে মাটির আর্দ্রতা ধারণক্ষমতা বাড়ায়।"
        ),
        "why_suitable_en": (
            "The premier climate-smart conservation rotation for High Barind Tract (AEZ 26) and drought-prone terraces. "
            "Wheat requires only 2-3 supplemental irrigations (150-250 mm) compared to 20-30 for flooded Boro (1000-1200 mm), "
            "saving 60-70% irrigation volume. Decomposing jute foliage adds 1.5-2.5 t/ha organic biomass (BJRI & BARI research)."
        ),
        "soil_benefit_bn": "পাটের পাতা ও মূল মাটিতে প্রচুর জৈব কার্বন যোগ করে মাটির পানির ধারণক্ষমতা বৃদ্ধি করে।",
        "soil_benefit_en": "Jute biomass drastically improves soil organic carbon and water-holding capacity across sandy-clay soils.",
        "water_regime_bn": "স্বল্প সেচ (গম মৌসুমে মাত্র ২-৩টি সম্পূরক সেচ, পাট ও আমন মূলত বৃষ্টির পানিতে পরিপুষ্ট হয়)।",
        "water_regime_en": "Low-water regime (wheat requires only 2-3 supplemental irrigations; jute and Aman leverage seasonal precipitation).",
        "risk_level_bn": "কম ঝুঁকি (দেরিতে গম বপন করলে শেষ সময়ে ব্লাস্ট বা তাপপ্রবাহের ঝুঁকি এড়াতে বারি গম-৩৩ ব্যবহার্য)।",
        "risk_level_en": "Low risk (sow blast-resistant BARI Gom-33 before Nov 30 to prevent terminal heat damage during grain filling).",
        "scientific_basis": "BWMRI (Bangladesh Wheat & Maize Research Institute) & BJRI Barind Sustainable Rotation",
    },
    {
        "id": "pattern_aman_mungbean_aus",
        "title_bn": "মাটির স্বাস্থ্য ও নাইট্রোজেন বৃদ্ধি আবর্তন (আমন → ডাল/মুগ → আউশ ধান)",
        "title_en": "Soil Rejuvenation & Pulse Cycle (T. Aman → Mungbean → T. Aus Rice)",
        "sequence_bn": "রোপা আমন ধান  ➔  গ্রীষ্মকালীন মুগডাল / মসুর  ➔  রোপা আউশ ধান",
        "sequence_en": "T. Aman Rice  ➔  Summer Mungbean / Lentil  ➔  T. Aus Rice",
        "crops": ["rice", "pulses", "rice"],
        "seasons": ["kharif-2", "rabi_late", "kharif-1"],
        "duration_days": {
            "rice_aman": 120,  # BRRI dhan71/87 (115-120d)
            "pulses": 65,      # BARI Mung-6 (60-65d)
            "rice_aus": 105,   # BRRI dhan48/82 (100-105d)
        },
        "water_intensity": "low",
        "irrigation_required": False, # Rainfed and low moisture tolerant
        "ideal_soils": ["loam", "sandy_loam", "clay_loam"],
        "unfavorable_soils": ["waterlogged_swamp"],
        "diversity_score": 96,
        "why_suitable_bn": (
            "মাটির ক্ষয়িষ্ণু উর্বরতা প্রাকৃতিকভাবে ফিরিয়ে আনতে ডাল জাতীয় ফসলের অন্তর্ভুক্তি সবচেয়ে কার্যকর পদ্ধতি। "
            "বার্ক সার সুপারিশ নির্দেশিকা (FRG 2018) অনুসারে, মুগডালের অবশিষ্টাংশ মাটিতে মিশিয়ে দিলে তা হেক্টরে প্রায় "
            "২০-৩৫ কেজি জৈব নাইট্রোজেন যোগ করতে পারে, যা পরবর্তী আউশ ধানের রাসায়নিক ইউরিয়া সারের চাহিদা ২০-৩০% পর্যন্ত "
            "হ্রাস করতে পারে এবং একইসাথে পরিবারের প্রোটিন পুষ্টির চাহিদা মেটায়।"
        ),
        "why_suitable_en": (
            "Ecologically restorative pulse-based rotation. According to the BARC Fertilizer Recommendation Guide (FRG 2018), "
            "incorporating mungbean stover contributes 20-35 kg N/ha of biological nitrogen, reducing chemical urea requirement "
            "by 20-30% for the subsequent rice crop while providing domestic protein."
        ),
        "soil_benefit_bn": "বাতাসের নাইট্রোজেন মাটিতে সংযোজন করে এবং মাটির স্বাস্থ্য ও অণুজীবের সক্রিয়তা বহুগুণ বাড়ায়।",
        "soil_benefit_en": "Biological atmospheric nitrogen fixation enriches depleted soil and promotes beneficial soil microbiome activity.",
        "water_regime_bn": "বৃষ্টি নির্ভর ও অতি সামান্য সেচ (মুগডালে সাধারণত কোনো গভীর সেচ প্রয়োজন হয় না)।",
        "water_regime_en": "Rainfed / minimal irrigation (mungbean thrives on residual moisture; Aus relies on pre-monsoon showers).",
        "risk_level_bn": "খুব কম ঝুঁকি (বৃষ্টির পানিতে স্বাভাবিক উৎপাদন সম্ভব, সেচের বিদ্যুৎ বা ডিজেল খরচ শূন্যের কাছাকাছি)।",
        "risk_level_en": "Very low risk (resilient to fuel/power tariffs; minimal irrigation infrastructure required).",
        "scientific_basis": "BARI Pulses Research Centre & BRRI Low-Carbon Rice Farming Framework (Adhunik Dhaner Chash, 24th Ed.)",
    },
    {
        "id": "pattern_aman_mustard_mungbean",
        "title_bn": "স্বল্প পানি ও তেল-ডাল সমৃদ্ধ আবর্তন (আমন → সরিষা → মুগডাল)",
        "title_en": "Low-Water Diversified Pattern (T. Aman → Mustard → Mungbean)",
        "sequence_bn": "রোপা আমন ধান  ➔  সরিষা  ➔  গ্রীষ্মকালীন মুগডাল",
        "sequence_en": "T. Aman Rice  ➔  Mustard  ➔  Summer Mungbean",
        "crops": ["rice", "mustard", "pulses"],
        "seasons": ["kharif-2", "rabi_early", "kharif-1"],
        "duration_days": {
            "rice_aman": 115,  # BRRI dhan75 (115d)
            "mustard": 80,     # BARI Sarisha-14 (75-80d)
            "pulses": 65,      # BARI Mung-6 (60-65d)
        },
        "water_intensity": "low",
        "irrigation_required": False,
        "ideal_soils": ["loam", "sandy_loam", "silt_loam"],
        "unfavorable_soils": ["heavy_clay"],
        "diversity_score": 98,
        "why_suitable_bn": (
            "ভূগর্ভস্থ পানির ওপর চাপ সৃষ্টি না করে খাদ্যশস্য, তেলবীজ ও ডাল—তিনটি ভিন্ন জাতের সুষম ফসল দেয়। "
            "সেচবিহীন বা সীমিত সেচ সুবিধার উঁচুজমিতে বোরো ধানের বিকল্প হিসেবে এটি অত্যন্ত লাভজনক, কম খরচের ও নিরাপদ শস্যচক্র।"
        ),
        "why_suitable_en": (
            "Optimizes grain, oilseed, and pulse production with near-zero groundwater depletion. "
            "An ideal sustainable replacement for irrigated Boro in water-scarce upland blocks (BARC Crop Diversification Project)."
        ),
        "soil_benefit_bn": "সরিষার গভীর মূল ও ডালের নাইট্রোজেন সংবন্ধন মিলে মাটির উর্বরতা ও কাঠামো সর্বোচ্চ উন্নত রাখে।",
        "soil_benefit_en": "Combines deep biomass root aeration from mustard with biological nitrogen enrichment from pulses.",
        "water_regime_bn": "অত্যন্ত কম সেচ (সরিষায় ১টি হালকা সেচ, মুগডালে সেচ ছাড়াই ভালো ফলন পাওয়া যায়)।",
        "water_regime_en": "Minimal water footprint (1 light irrigation for mustard; mungbean grows largely on residual pre-monsoon moisture).",
        "risk_level_bn": "খুব কম ঝুঁকি (অতিরিক্ত সেচের প্রয়োজন নেই)।",
        "risk_level_en": "Very low risk (insulates farm budget against rising water pumping costs).",
        "scientific_basis": "BARC Crop Diversification Project & BARI Agronomy Division",
    },
]


# ── Authoritative BARC Agro-Ecological Zones (AEZ) Mapping ───────────────────

DISTRICT_AEZ_PROFILES: Dict[str, Dict[str, Any]] = {
    "bogura": {
        "aez_code": "AEZ-4 & AEZ-25",
        "aez_name_bn": "করতোয়া-বাঙালি প্লাবনভূমি ও সমতল বরেন্দ্র অঞ্চল",
        "aez_name_en": "Karatoa-Bangali Floodplain & Level Barind Tract",
        "favored_crops": ["potato", "maize", "mustard", "rice"],
        "discouraged_crops": [],
        "soil_suitability_bonus": {"sandy_loam": 5, "loam": 5, "silt_loam": 5},
        "description": "Premier intensive 3-crop agricultural hub with high responsiveness to potato, hybrid maize, and mustard."
    },
    "rangpur": {
        "aez_code": "AEZ-3",
        "aez_name_bn": "তিস্তা পলল প্লাবনভূমি",
        "aez_name_en": "Tista Meander Floodplain",
        "favored_crops": ["potato", "maize", "mustard", "rice"],
        "discouraged_crops": [],
        "soil_suitability_bonus": {"sandy_loam": 6, "loam": 5, "silt_loam": 5},
        "description": "Well-drained light-textured floodplain highly suited for early tuber crops and winter oilseeds."
    },
    "dinajpur": {
        "aez_code": "AEZ-1",
        "aez_name_bn": "পুরাতন হিমালয় পাদদেশীয় সমভূমি",
        "aez_name_en": "Old Himalayan Piedmont Plain",
        "favored_crops": ["wheat", "maize", "potato", "rice"],
        "discouraged_crops": [],
        "soil_suitability_bonus": {"sandy_loam": 6, "loam": 5},
        "description": "Favorable cool winter conditions with low night temperatures, ideal for wheat and potato."
    },
    "rajshahi": {
        "aez_code": "AEZ-26",
        "aez_name_bn": "উচ্চ বরেন্দ্র ভূমি",
        "aez_name_en": "High Barind Tract",
        "favored_crops": ["jute", "wheat", "pulses", "mustard"],
        "discouraged_crops": ["boro"],
        "soil_suitability_bonus": {"clay_loam": 5, "loam": 4},
        "description": "Drought-prone undulating terrace with critical groundwater decline; prioritizes low-water conservation rotations."
    },
    "sylhet": {
        "aez_code": "AEZ-20 & AEZ-21",
        "aez_name_bn": "পূর্ব সুরমা-কুশিয়ারা প্লাবনভূমি ও সিলেট অববাহিকা",
        "aez_name_en": "Eastern Surma-Kushiyara Floodplain & Sylhet Basin",
        "favored_crops": ["rice", "pulses"],
        "discouraged_crops": ["potato", "wheat"],
        "soil_suitability_bonus": {"clay": 4, "clay_loam": 4},
        "description": "High-rainfall basin prone to waterlogging and soil acidity; dryland rabi crops require specialized drainage."
    },
}


# ── Decision Engine Core Logic ────────────────────────────────────────────────

def evaluate_rotation_feasibility(
    pattern: Dict[str, Any],
    has_irrigation: bool,
    soil_type: str,
    district: str,
    current_crop: str,
    season: str = "rabi",
    climate_summary: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluates agronomic feasibility and calculates multi-criteria suitability scores:
    1. Hard Irrigation Gating (strictly rejects water-intensive Boro if has_irrigation is False)
    2. Soil Texture Compatibility & Crop Interaction
    3. Regional AEZ Agro-ecological Suitability (BARC AEZ 1-30)
    4. Seasonal Alignment & Timeliness (DAE Crop Calendars)
    5. Crop Sequence Continuity & Pest Break Benefits
    6. Historical Climate Observation Fit (NASA POWER telemetry or transparent deterministic fallback)
    7. Turnaround Duration Bounds within 365 days
    """
    constraints: List[str] = []
    is_feasible = True
    norm_soil = (soil_type or "loam").lower().strip()
    norm_current_crop = (current_crop or "rice").lower().strip()
    norm_district = (district or "bogura").lower().strip()
    norm_season = (season or "rabi").lower().strip()
    has_telemetry = bool(climate_summary and any(v is not None for v in climate_summary.values()))

    # 1. HARD CONSTRAINT: Irrigation Availability
    requires_irrigation = pattern["irrigation_required"]
    water_intensity = pattern["water_intensity"]

    water_score = 80
    if not has_irrigation:
        if "boro" in pattern["id"] or water_intensity == "high":
            is_feasible = False
            water_score = 15
            constraints.append(
                "পানির তীব্র সংকট: সেচ সুবিধা না থাকায় রবি মৌসুমে প্লাবিত বোরো ধান চাষে ফসল বিপর্যয়ের নিশ্চিত ঝুঁকি রয়েছে। "
                "(Critical constraint: Cultivating flooded Boro rice without assured irrigation guarantees crop failure)."
            )
        else:
            # Low water pattern thrives in rainfed conditions
            water_score = 94
    else:
        if water_intensity in ["moderate", "low"]:
            water_score = 90
        else:
            water_score = 82  # Feasible but incurs continuous pumping costs

    # 2. SOIL TEXTURE COMPATIBILITY
    ideal_soils = pattern.get("ideal_soils", ["loam"])
    unfavorable_soils = pattern.get("unfavorable_soils", [])

    soil_score = 75
    if any(s in norm_soil for s in ideal_soils):
        soil_score = 92
    elif any(s in norm_soil for s in unfavorable_soils):
        soil_score = 45
        if "potato" in pattern["crops"] and ("clay" in norm_soil or "এঁটেল" in norm_soil):
            constraints.append(
                "মাটির প্রতিকূলতা: এঁটেল মাটিতে আলুর কন্দ প্রসারণ বাধাগ্রস্ত হয় এবং উত্তোলনের সময় কন্দ ফেটে যাওয়ার ঝুঁকি থাকে (উৎস: BARI কন্দাল ফসল গবেষণা কেন্দ্র)। "
                "(Soil constraint: Heavy clay impedes potato tuber expansion and post-harvest digging; BARI Tuber Crops Centre)."
            )
        elif "mustard" in pattern["crops"] and ("heavy_clay" in norm_soil or "clay" in norm_soil):
            soil_score = 50
            constraints.append(
                "মাটির সতর্কতা: অতিরিক্ত ভারী মাটিতে জলাবদ্ধতা তৈরি হলে সরিষার মূল পচে যাওয়ার ঝুঁকি থাকে। "
                "(Soil caution: Heavy clay susceptible to poor aeration and root rot in mustard)."
            )
    else:
        soil_score = 78

    # 3. REGIONAL AEZ AGRO-ECOLOGICAL FIT (BARC Guidelines)
    aez_profile = DISTRICT_AEZ_PROFILES.get(norm_district, DISTRICT_AEZ_PROFILES.get("bogura"))
    aez_bonus = 0
    if aez_profile:
        favored = aez_profile.get("favored_crops", [])
        discouraged = aez_profile.get("discouraged_crops", [])

        # Check if rotation contains favored crops
        favored_matches = [c for c in pattern["crops"] if c in favored]
        if favored_matches:
            aez_bonus += 5

        # Check if rotation contains discouraged crops in this AEZ
        if any(c in discouraged for c in pattern["crops"]) or ("boro" in pattern["id"] and "boro" in discouraged):
            if norm_district == "rajshahi":
                if has_irrigation:
                    water_score = max(20, water_score - 12)
                    constraints.append(
                        "বরেন্দ্র অঞ্চল সতর্কতা: উচ্চ বরেন্দ্র ভূমিতে (AEZ 26) ভূগর্ভস্থ পানির স্তর দ্রুত হ্রাস পাওয়ায় বোরো চাষ নিরুৎসাহিত করা হচ্ছে (উৎস: BMDA ও DAE)। "
                        "(Barind caution: Rapid groundwater depletion in High Barind AEZ-26 strongly discourages continuous Boro)."
                    )
            elif norm_district == "sylhet":
                if any(c in ["potato", "wheat"] for c in pattern["crops"]):
                    soil_score = max(25, soil_score - 15)
                    constraints.append(
                        "ভৌগোলিক সীমাবদ্ধতা: সিলেট অববাহিকার অতিরিক্ত বৃষ্টিপাত ও অম্লীয় মাটিতে গম বা আলুর স্বাভাবিক বৃদ্ধির জন্য বিশেষ নিষ্কাশন প্রয়োজন (উৎস: BARC AEZ-20 নির্দেশিকা)। "
                        "(Regional constraint: Excessive rainfall and acid basin soils in Sylhet impede dryland potato and wheat without raised beds)."
                    )

    # 4. SEASONAL ALIGNMENT & TIMELINESS (DAE Crop Calendars)
    season_bonus = 0
    if norm_season in ["rabi", "রবি"]:
        # Rabi season favors immediate planting of potato, mustard, wheat, boro, pulses
        if any(c in pattern["crops"] for c in ["potato", "mustard", "wheat"]):
            season_bonus += 6
    elif norm_season in ["kharif-1", "খরিপ-১", "kharif1"]:
        # Kharif-1 pre-monsoon favors jute, aus, summer mungbean, maize
        if any(c in pattern["crops"] for c in ["jute", "pulses", "maize"]):
            season_bonus += 6
    elif norm_season in ["kharif-2", "খরিপ-২", "kharif2"]:
        # Kharif-2 monsoon favors T. Aman rice
        if "rice" in pattern["crops"]:
            season_bonus += 5

    # 5. CROP CONTINUITY & BIOLOGICAL PEST BREAK
    continuity_bonus = 0
    if "rice" in norm_current_crop or "ধান" in norm_current_crop:
        # Non-rice break crops break rice stem borer and sheath blight cycles
        if any(c in pattern["crops"] for c in ["mustard", "potato", "pulses", "jute"]):
            continuity_bonus += 5
    elif "potato" in norm_current_crop or "আলু" in norm_current_crop:
        if pattern["crops"][0] == "potato" or (len(pattern["crops"]) > 1 and pattern["crops"][1] == "potato"):
            soil_score = max(20, soil_score - 15)
            constraints.append(
                "ফসল চক্র সতর্কতা: পরপর একই জমিতে আলু চাষে নাবি ধসা রোগ ও কৃমির প্রাদুর্ভাব বহুগুণ বৃদ্ধি পায় (উৎস: BARI কন্দাল ফসল গবেষণা কেন্দ্র)। "
                "(Pest caution: Continuous solanaceous potato monoculture escalates late blight and nematode soil carryover)."
            )
    elif "jute" in norm_current_crop or "পাট" in norm_current_crop:
        if "jute" in pattern["crops"]:
            continuity_bonus += 5

    # 6. HISTORICAL CLIMATE OBSERVATION FIT (NASA POWER) OR DETERMINISTIC RULES
    climate_score = 80
    if has_telemetry:
        avg_temp = climate_summary.get("avg_temperature")
        avg_soil_moist = climate_summary.get("avg_soil_moisture")

        if avg_soil_moist is not None:
            if avg_soil_moist < 0.35 and not has_irrigation:
                # Dry root-zone on rainfed land
                if water_intensity == "low":
                    climate_score += 8  # Rewards drought-resilient legumes/mustard
                else:
                    climate_score -= 25
                    constraints.append(
                        "মাটির আর্দ্রতা ঘাটতি: নাসা স্যাটেলাইট উপাত্ত অনুযায়ী মূল-শিকড় স্তরে আর্দ্রতা কম (৩৫% এর নিচে)। "
                        "(Root-zone moisture deficit: NASA POWER observations indicate <35% root-zone wetness)."
                    )
            elif avg_soil_moist > 0.70:
                # Saturated soil
                if "potato" in pattern["crops"]:
                    climate_score -= 10  # Excessive moisture risks blight
                elif "rice" in pattern["crops"]:
                    climate_score += 6

        if avg_temp is not None:
            if avg_temp > 32.0 and "wheat" in pattern["crops"]:
                climate_score -= 8
                constraints.append(
                    "তাপমাত্রা সতর্কতা: বর্তমান তাপমাত্রা বেশি হওয়ায় গমের দেরিতে বপন পরিহার করুন। "
                    "(Heat caution: Elevated temperatures require prompt wheat sowing before terminal heat)."
                )
    else:
        # Offline mode / no telemetry: Base score on static AEZ suitability without fabricated numbers
        climate_score = 80

    climate_score = max(20, min(98, climate_score + aez_bonus + season_bonus + continuity_bonus))

    # 7. DURATION FIT WITHIN 365 DAYS
    durations = pattern["duration_days"]
    total_duration = sum(durations.values())
    turnaround_margin = 365 - total_duration

    if total_duration > 365:
        is_feasible = False
        constraints.append(
            f"সময়সূচীর অসংগতি: ফসলের মোট জীবনকাল ({total_duration} দিন) ৩৬৫ দিনের সীমা অতিক্রম করেছে। "
            f"(Schedule conflict: Cumulative crop duration of {total_duration} days exceeds annual 365-day boundary)."
        )
    elif turnaround_margin < 15:
        climate_score = max(20, climate_score - 10)
        constraints.append(
            "সময়সূচীর সীমাবদ্ধতা: ৩টি ফসলের মধ্যবর্তী ফাঁকা সময় ১৫ দিনের কম; স্বল্পমেয়াদী জাত নির্বাচনে সতর্ক থাকুন। "
            "(Turnaround margin <15 days between crops requires strict short-duration cultivars)."
        )

    # 8. MULTI-CRITERIA DECISION ANALYSIS (MCDA) COMPOSITE SCORE
    diversity_score = pattern.get("diversity_score", 85)

    if is_feasible:
        if has_telemetry:
            # Multi-Criteria Weights: Climate (0.35), Water (0.30), Diversity (0.20), Soil (0.15)
            raw_weighted = (
                0.35 * climate_score +
                0.30 * water_score +
                0.20 * diversity_score +
                0.15 * soil_score
            )
        else:
            # Deterministic Static Mode Weights: Water (0.35), Diversity (0.30), Soil (0.20), Regional AEZ (0.15)
            raw_weighted = (
                0.35 * water_score +
                0.30 * diversity_score +
                0.20 * soil_score +
                0.15 * climate_score
            )
        suitability_score = round(raw_weighted / 100.0, 2)
        if suitability_score >= 0.90:
            tier = "High"
            rating = "অসাধারণ (A+)"
        elif suitability_score >= 0.82:
            tier = "Moderate"
            rating = "খুব ভালো (A)"
        else:
            tier = "Moderate"
            rating = "ভালো (B+)"
    else:
        suitability_score = round(min(0.25, (0.4 * water_score + 0.6 * climate_score) / 100.0), 2)
        tier = "Infeasible"
        rating = "অনুপযোগী (Infeasible)"

    return {
        "id": pattern["id"],
        "title_bn": pattern["title_bn"],
        "title_en": pattern["title_en"],
        "sequence_bn": pattern["sequence_bn"],
        "sequence_en": pattern["sequence_en"],
        "crops": pattern["crops"],
        "seasons": pattern["seasons"],
        "duration_days_total": total_duration,
        "turnaround_days_margin": turnaround_margin,
        "is_feasible": is_feasible,
        "suitability_score": suitability_score,
        "suitability_tier": tier,
        "climate_suitability_score": int(round(climate_score)),
        "water_compatibility_score": int(round(water_score)),
        "diversity_score": int(round(diversity_score)),
        "overall_rating": rating,
        "why_suitable_bn": pattern["why_suitable_bn"],
        "why_suitable_en": pattern["why_suitable_en"],
        "soil_benefit_bn": pattern["soil_benefit_bn"],
        "soil_benefit_en": pattern["soil_benefit_en"],
        "water_regime_bn": pattern["water_regime_bn"],
        "water_regime_en": pattern["water_regime_en"],
        "risk_level_bn": pattern["risk_level_bn"],
        "risk_level_en": pattern["risk_level_en"],
        "constraints": constraints,
        "scientific_basis": pattern["scientific_basis"],
    }


async def generate_crop_rotation_recommendations(
    request: CropRotationRequest,
) -> CropRotationResponse:
    """
    Coordinates historical NASA POWER telemetry with Bangladesh AEZ multi-crop constraints.
    Returns ranked, explainable rotation recommendations with full data lineage.
    """
    district = request.district.lower().strip() if request.district else "bogura"
    if district not in DISTRICT_COORDS and district != "default":
        # Check aliases or fallback
        if district in ["bogra", "বগুড়া"]:
            district = "bogura"
        elif district in ["রংপুর"]:
            district = "rangpur"
        elif district in ["দিনাজপুর"]:
            district = "dinajpur"
        elif district in ["রাজশাহী"]:
            district = "rajshahi"
        elif district in ["সিলেট"]:
            district = "sylhet"
        else:
            district = "bogura"

    # Fetch NASA POWER historical observations
    is_fallback = False
    climate_summary: Dict[str, Any] = {}
    try:
        telemetry = await fetch_nasa_power_data(
            district=district,
            lat=request.latitude,
            lon=request.longitude,
        )
        climate_summary = get_summary_stats(telemetry.get("data", []))
        telemetry_source = telemetry.get("source", "NASA POWER Daily Agroclimatology")
        display_name = telemetry.get("display_name", district.title())
    except Exception:
        # Transparent fallback: Static deterministic BARC AEZ rules without fabricated synthetic numbers
        is_fallback = True
        telemetry_source = "Unavailable (Historical Satellite Offline - Using Static BARC AEZ Deterministic Rules)"
        display_name = district.replace("bogra", "bogura").title()
        climate_summary = {}  # Strictly empty: NO unverified simulated numbers substituted

    # Evaluate each candidate pattern in the database
    evaluated_plans: List[RotationPlanItem] = []
    season_val = request.season or "rabi"
    for pattern in CROPPING_PATTERNS_DATABASE:
        res = evaluate_rotation_feasibility(
            pattern=pattern,
            has_irrigation=request.has_irrigation,
            soil_type=request.soil_type or "loam",
            district=district,
            current_crop=request.current_crop,
            season=season_val,
            climate_summary=climate_summary,
        )
        evaluated_plans.append(RotationPlanItem(**res))

    # Rank: Feasible plans first sorted by suitability_score descending; infeasible plans placed at bottom
    ranked_plans = sorted(
        evaluated_plans,
        key=lambda p: (1 if p.is_feasible else 0, p.suitability_score),
        reverse=True,
    )

    data_sources = [
        "NASA POWER (Prediction Of Worldwide Energy Resources) Daily Agroclimatology API",
        "Bangladesh Agricultural Research Council (BARC) Agro-Ecological Zones (AEZ) Database & FRG-2018",
        "BARI Handbook on Agricultural Technologies (Krishi Projukti Hatboi, 8th Edition, 2019)",
        "BRRI Modern Rice Cultivation Guidelines (Adhunik Dhaner Chash, 24th Edition, 2020)",
        "Department of Agricultural Extension (DAE) National Crop Calendars",
        "Bangladesh Jute Research Institute (BJRI) Cropping System Reports",
    ]

    limitations = (
        "SCIENTIFIC ASSUMPTIONS & LIMITATIONS: These crop rotation recommendations are deterministic agronomic "
        "compatibility evaluations based on BARC AEZ guidelines, physiological thresholds, and historical NASA POWER "
        "observations. They do NOT constitute machine-learning yield predictions or weather forecasts. "
        "Field success is influenced by farm-level micro-topography, bund drainage, soil pH/salinity, and pest infestation. "
        "Farmers should consult their local Sub-Assistant Agriculture Officer (SAAO / উপসহকারী কৃষি কর্মকর্তা) before seed purchase."
    )
    if is_fallback:
        limitations += " (Notice: Live NASA satellite telemetry was unavailable during this assessment; evaluation used static BARC AEZ deterministic guidelines without synthetic climate fabrication)."

    return CropRotationResponse(
        district=district,
        display_name=display_name,
        has_irrigation=request.has_irrigation,
        soil_type=request.soil_type or "loam",
        current_crop=request.current_crop,
        season_context=season_val,
        telemetry_source=telemetry_source,
        climate_context=climate_summary,
        is_fallback_telemetry=is_fallback,
        recommended_rotations=ranked_plans,
        data_sources=data_sources,
        scientific_assumptions_and_limitations=limitations,
    )
