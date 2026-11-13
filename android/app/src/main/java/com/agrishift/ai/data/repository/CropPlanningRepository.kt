package com.agrishift.ai.data.repository

import com.agrishift.ai.data.api.ApiClient
import com.agrishift.ai.data.model.CropRotationApiResponse
import com.agrishift.ai.data.model.CropRotationPlan
import com.agrishift.ai.data.model.FarmProfile
import com.agrishift.ai.data.model.PlanComparisonItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class RotationUiState {
    object Idle : RotationUiState()
    object Loading : RotationUiState()
    data class Success(
        val plans: List<CropRotationPlan>,
        val telemetrySource: String = "NASA POWER Daily Agroclimatology",
        val isFallbackTelemetry: Boolean = false,
        val limitations: String = "",
        val dataSources: List<String> = emptyList(),
        val isOffline: Boolean = false
    ) : RotationUiState()
    data class Error(
        val messageBn: String,
        val messageEn: String,
        val rawError: String? = null,
        val fallbackPlans: List<CropRotationPlan> = emptyList()
    ) : RotationUiState()
}

class CropPlanningRepository {

    private val _rotationState = MutableStateFlow<RotationUiState>(RotationUiState.Idle)
    val rotationState: StateFlow<RotationUiState> = _rotationState.asStateFlow()

    private var cachedKey: String? = null
    private var cachedResponse: CropRotationApiResponse? = null

    suspend fun loadRotationPlans(
        farmProfile: FarmProfile,
        forceRefresh: Boolean = false
    ) {
        val cacheKey = "${farmProfile.districtId}_${farmProfile.currentCrop}_${farmProfile.season}_${farmProfile.soilType}_${farmProfile.hasIrrigation}"

        if (!forceRefresh && cacheKey == cachedKey && cachedResponse != null) {
            val resp = cachedResponse!!
            _rotationState.value = RotationUiState.Success(
                plans = resp.recommendedRotations,
                telemetrySource = resp.telemetrySource,
                isFallbackTelemetry = resp.isFallbackTelemetry,
                limitations = resp.scientificAssumptionsAndLimitations,
                dataSources = resp.dataSources,
                isOffline = false
            )
            return
        }

        _rotationState.value = RotationUiState.Loading

        val normSeason = when {
            farmProfile.season.contains("রবি") -> "rabi"
            farmProfile.season.contains("১") -> "kharif-1"
            farmProfile.season.contains("২") -> "kharif-2"
            else -> farmProfile.season.lowercase()
        }

        val normSoil = when {
            farmProfile.soilType.contains("বেলে") -> "sandy_loam"
            farmProfile.soilType.contains("এঁটেল") -> "clay"
            farmProfile.soilType.contains("পলি") -> "silt_loam"
            else -> "loam"
        }

        val normCrop = when {
            farmProfile.currentCrop.contains("ধান") -> "rice"
            farmProfile.currentCrop.contains("গম") -> "wheat"
            farmProfile.currentCrop.contains("ভুট্টা") -> "maize"
            farmProfile.currentCrop.contains("আলু") -> "potato"
            farmProfile.currentCrop.contains("সরিষা") -> "mustard"
            farmProfile.currentCrop.contains("ডাল") || farmProfile.currentCrop.contains("মুগ") -> "pulses"
            farmProfile.currentCrop.contains("পাট") -> "jute"
            else -> farmProfile.currentCrop.lowercase()
        }

        val result = ApiClient.fetchCropRotations(
            district = farmProfile.districtId,
            currentCrop = normCrop,
            season = normSeason,
            soilType = normSoil,
            hasIrrigation = farmProfile.hasIrrigation,
            lat = farmProfile.latitude,
            lon = farmProfile.longitude
        )

        if (result.isSuccess) {
            val resp = result.getOrNull()!!
            cachedKey = cacheKey
            cachedResponse = resp
            _rotationState.value = RotationUiState.Success(
                plans = resp.recommendedRotations,
                telemetrySource = resp.telemetrySource,
                isFallbackTelemetry = resp.isFallbackTelemetry,
                limitations = resp.scientificAssumptionsAndLimitations,
                dataSources = resp.dataSources,
                isOffline = false
            )
        } else {
            val ex = result.exceptionOrNull()
            val fallbackPlans = getRotationPlans(
                district = farmProfile.districtId,
                currentCrop = farmProfile.currentCrop,
                hasIrrigation = farmProfile.hasIrrigation
            )
            _rotationState.value = RotationUiState.Error(
                messageBn = "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। লাইভ স্যাটেলাইট ও কৃষি উপাত্ত পেতে ব্যাকএন্ড সার্ভার চালু আছে কিনা নিশ্চিত করুন।",
                messageEn = "Could not connect to the decision engine server. Please verify backend connectivity to fetch live telemetry.",
                rawError = ex?.message,
                fallbackPlans = fallbackPlans
            )
        }
    }

    fun switchToOfflineMode(farmProfile: FarmProfile) {
        val fallbackPlans = getRotationPlans(
            district = farmProfile.districtId,
            currentCrop = farmProfile.currentCrop,
            hasIrrigation = farmProfile.hasIrrigation
        )
        _rotationState.value = RotationUiState.Success(
            plans = fallbackPlans,
            telemetrySource = "স্থানীয় অফলাইন ডেটাবেজ (BARC AEZ গাইডলাইন)",
            isFallbackTelemetry = true,
            limitations = "সার্ভার সংযোগ বিচ্ছিন্ন থাকায় অফলাইন স্থানীয় বার্ক (BARC) এইজেড গাইডলাইন প্রদর্শিত হচ্ছে।",
            dataSources = listOf("Bangladesh Agricultural Research Council (BARC) AEZ Database (Offline)"),
            isOffline = true
        )
    }

    fun getRotationPlans(
        district: String = "bogura",
        currentCrop: String = "ধান",
        hasIrrigation: Boolean = true
    ): List<CropRotationPlan> {
        val boroFeasible = hasIrrigation
        val boroConstraints = if (!boroFeasible) {
            listOf("পানির তীব্র সংকট: সেচ সুবিধা না থাকায় বোরো ধান চাষে ফসল বিপর্যয়ের নিশ্চিত ঝুঁকি রয়েছে। (Cultivating Boro rice without irrigation guarantees crop failure).")
        } else emptyList()

        val allPlans = listOf(
            CropRotationPlan(
                id = "plan_a_mustard_paddy",
                titleBn = "আঞ্চলিক গাইডলাইন: ৩ ফসলি নিবিড় আবর্তন (আমন → সরিষা → বোরো)",
                sequenceBn = "রোপা আমন ধান  ➔  স্বল্পমেয়াদী সরিষা  ➔  বোরো ধান",
                crops = listOf("আমন ধান", "সরিষা", "বোরো ধান"),
                climateSuitability = if (boroFeasible) "অনুকূল (আঞ্চলিক)" else "অনুপযোগী",
                climateSuitabilityPercent = 0,
                waterRequirement = if (boroFeasible) "পরিমিত সেচ প্রয়োজন" else "সেচ ছাড়া অসম্ভব",
                waterCompatibilityPercent = 0,
                diversityScore = "খাদ্যশস্য + তেলবীজ",
                diversityScorePercent = 0,
                soilBenefitBn = "সরিষার শিকড় মাটির গভীরে জৈব পদার্থ যোগ করে এবং আগাছার বিস্তার রোধ করতে সহায়তা করে।",
                whySuitableBn = "বাংলাদেশ কৃষি গবেষণা কাউন্সিলের (BARC) কৃষি-পরিবেশ অঞ্চল (AEZ) সাধারণ নির্দেশিকা অনুসারে নির্বাচিত। স্বল্পমেয়াদী সরিষা (বারি-১৪/১৭) ৭৫-৮০ দিনে ঘরে ওঠে। এটি সাধারণ আঞ্চলিক দিকনির্দেশনা, কোনো নির্দিষ্ট খামারের যাচাইকৃত পূর্বাভাস নয়—উপজেলা কৃষি কর্মকর্তার পরামর্শ নিন।",
                seasonDetailsBn = "খরিপ-২ (জুলাই-নভেম্বর) ➔ রবি (নভেম্বর-জানুয়ারি) ➔ রবি/খরিপ-১ (ফেব্রুয়ারি-মে)",
                riskLevelBn = if (boroFeasible) "কম ঝুঁকি (নভেম্বরের মধ্যে সরিষা বপন করলে ফলন সর্বোচ্চ)" else "চরম ঝুঁকি (সেচের অভাব)",
                titleEn = "Regional Guideline: 3-Crop Intensive Cycle (Aman → Mustard → Boro)",
                sequenceEn = "Transplanted Aman  ➔  Short-duration Mustard  ➔  Boro Rice",
                soilBenefitEn = "Mustard taproots incorporate organic matter and break weed propagation cycles.",
                whySuitableEn = "Selected from general BARC AEZ regional patterns. Short-duration mustard (BARI-14/17) matures in 75-80 days. General regional guidance only, not a verified field-specific recommendation. Consult your Upazila Agriculture Officer.",
                seasonDetailsEn = "Kharif-2 (Jul-Nov) ➔ Rabi (Nov-Jan) ➔ Rabi/Kharif-1 (Feb-May)",
                riskLevelEn = if (boroFeasible) "Low Risk (optimal when mustard is sown before late November)" else "Extreme Risk (Water Deficit)",
                isFeasible = boroFeasible,
                suitabilityScore = 0.0,
                suitabilityTier = if (boroFeasible) "Regional Guideline" else "Infeasible",
                constraints = boroConstraints,
                scientificBasis = "BRRI Modern Rice Cultivation (24th Ed., pp. 12-16) & BARI Oilseed Guidelines",
                isOfflineGuidance = true
            ),
            CropRotationPlan(
                id = "plan_b_potato_maize",
                titleBn = "আঞ্চলিক গাইডলাইন: অর্থকরী আবর্তন (আমন → আলু → ভুট্টা)",
                sequenceBn = "রোপা আমন ধান  ➔  আলু  ➔  হাইব্রিড ভুট্টা",
                crops = listOf("আমন ধান", "আলু", "ভুট্টা"),
                climateSuitability = "অনুকূল (আঞ্চলিক)",
                climateSuitabilityPercent = 0,
                waterRequirement = "বোরো ধানের তুলনায় সাশ্রয়ী পানি চাহিদা (মাঝারি সেচ)",
                waterCompatibilityPercent = 0,
                diversityScore = "খাদ্যশস্য + কন্দাল + দানাশস্য",
                diversityScorePercent = 0,
                soilBenefitBn = "আলুর জমিতে প্রয়োগকৃত অবশিষ্টাংশ সার ও পুষ্টি ভুট্টা গ্রহণ করে, ফলে রাসায়নিক সারের অপচয় রোধ হয়।",
                whySuitableBn = "বাংলাদেশ কৃষি গবেষণা কাউন্সিলের (BARC) কৃষি-পরিবেশ অঞ্চল (AEZ) সাধারণ নির্দেশিকা অনুসারে নির্বাচিত। উত্তরবঙ্গে (বগুড়া, রংপুর, দিনাজপুর) আলু ও ভুট্টা সুপ্রতিষ্ঠিত শস্যচক্র। এটি সাধারণ আঞ্চলিক দিকনির্দেশনা, কোনো নির্দিষ্ট খামারের যাচাইকৃত পূর্বাভাস নয়—উপজেলা কৃষি কর্মকর্তার পরামর্শ নিন।",
                seasonDetailsBn = "খরিপ-২ (জুলাই-অক্টোবর) ➔ রবি (নভেম্বর-ফেব্রুয়ারি) ➔ খরিপ-১ (মার্চ-জুন)",
                riskLevelBn = "মাঝারি ঝুঁকি (আলু তোলার সময় স্থানীয় বাজারে দর যাচাই করা দরকার)",
                titleEn = "Regional Guideline: Cash Crop Cycle (Aman → Potato → Maize)",
                sequenceEn = "T. Aman Rice  ➔  Potato  ➔  Hybrid Maize",
                soilBenefitEn = "Deep-rooting maize scavenges residual fertilizer applied to potato, preventing nutrient runoff.",
                whySuitableEn = "Selected from general BARC AEZ regional patterns. Well-established cash rotation in North Bengal. General regional guidance only, not a verified field-specific recommendation. Consult your Upazila Agriculture Officer.",
                seasonDetailsEn = "Kharif-2 (Jul-Oct) ➔ Rabi (Nov-Feb) ➔ Kharif-1 (Mar-Jun)",
                riskLevelEn = "Moderate Risk (monitor local tuber harvest market prices)",
                isFeasible = true,
                suitabilityScore = 0.0,
                suitabilityTier = "Regional Guideline",
                constraints = emptyList(),
                scientificBasis = "BARI Krishi Projukti Hatboi (8th Ed., 2019, Tuber Crops pp. 45-52) & BARC AEZ Guidelines",
                isOfflineGuidance = true
            ),
            CropRotationPlan(
                id = "plan_c_jute_wheat",
                titleBn = "আঞ্চলিক গাইডলাইন: বরেন্দ্র ও পানি সাশ্রয়ী আবর্তন (পাট → আমন → গম)",
                sequenceBn = "তোষা পাট  ➔  রোপা আমন ধান  ➔  তাপ সহনশীল গম",
                crops = listOf("পাট", "আমন ধান", "গম"),
                climateSuitability = "অনুকূল (আঞ্চলিক)",
                climateSuitabilityPercent = 0,
                waterRequirement = "স্বল্প ভূগর্ভস্থ পানি খরচ",
                waterCompatibilityPercent = 0,
                diversityScore = "আঁশ + খাদ্যশস্য",
                diversityScorePercent = 0,
                soilBenefitBn = "পাটের ঝরে পড়া পাতা মাটিতে হিউমাস ও প্রাকৃতিক জৈব সার তৈরি করে, যা মাটির আর্দ্রতা ধরে রাখে।",
                whySuitableBn = "বাংলাদেশ কৃষি গবেষণা কাউন্সিলের (BARC) কৃষি-পরিবেশ অঞ্চল (AEZ) সাধারণ নির্দেশিকা অনুসারে নির্বাচিত। উচ্চ বরেন্দ্র ও শুষ্ক অঞ্চলে ভূগর্ভস্থ পানির অপচয় কমাতে গম চাষ পরিবেশবান্ধব। এটি সাধারণ আঞ্চলিক দিকনির্দেশনা, কোনো নির্দিষ্ট খামারের যাচাইকৃত পূর্বাভাস নয়—উপজেলা কৃষি কর্মকর্তার পরামর্শ নিন।",
                seasonDetailsBn = "খরিপ-১ (চৈত্র-আষাঢ়) ➔ খরিপ-২ (শ্রাবণ-কার্তিক) ➔ রবি (অগ্রহায়ণ-ফাল্গুন)",
                riskLevelBn = "কম ঝুঁকি (দেরিতে গম বপন পরিহার করে বারি গম-৩৩ জাত ব্যবহার্য)",
                titleEn = "Regional Guideline: Barind Water-Saving Cycle (Jute → Aman → Wheat)",
                sequenceEn = "Tossho Jute  ➔  T. Aman Rice  ➔  Heat-tolerant Wheat",
                soilBenefitEn = "Fallen jute biomass decomposes into humus, increasing topsoil organic matter and water-holding capacity.",
                whySuitableEn = "Selected from general BARC AEZ regional patterns. Replaces water-intensive Boro with heat-tolerant wheat. General regional guidance only, not a verified field-specific recommendation. Consult your Upazila Agriculture Officer.",
                seasonDetailsEn = "Kharif-1 (Apr-Jul) ➔ Kharif-2 (Jul-Nov) ➔ Rabi (Nov-Mar)",
                riskLevelEn = "Low Risk (ensure prompt sowing before Dec 5 to avoid late-season terminal heat)",
                isFeasible = true,
                suitabilityScore = 0.0,
                suitabilityTier = "Regional Guideline",
                constraints = emptyList(),
                scientificBasis = "BARI Wheat & Maize Research Institute (BWMRI Handbook, pp. 22-28) & BJRI Guidelines",
                isOfflineGuidance = true
            ),
            CropRotationPlan(
                id = "plan_d_legume_enrichment",
                titleBn = "আঞ্চলিক গাইডলাইন: নাইট্রোজেন বৃদ্ধি আবর্তন (আমন → মুগডাল → আউশ)",
                sequenceBn = "রোপা আমন ধান  ➔  মুগডাল / মসুর  ➔  রোপা আউশ ধান",
                crops = listOf("আমন ধান", "মুগডাল", "আউশ ধান"),
                climateSuitability = "অনুকূল (আঞ্চলিক)",
                climateSuitabilityPercent = 0,
                waterRequirement = "বৃষ্টি নির্ভর ও অতি সামান্য সেচ",
                waterCompatibilityPercent = 0,
                diversityScore = "ডাল ও পরিবেশবান্ধব শস্যচক্র",
                diversityScorePercent = 0,
                soilBenefitBn = "ডাল ফসলের মূলের নডিউল বাতাসে থাকা নাইট্রোজেন মাটিতে সংবন্ধন করে, ফলে পরবর্তী ফসলে রাসায়নিক ইউরিয়া সার সাশ্রয় হয়।",
                whySuitableBn = "বাংলাদেশ কৃষি গবেষণা কাউন্সিলের (BARC) কৃষি-পরিবেশ অঞ্চল (AEZ) সাধারণ নির্দেশিকা অনুসারে নির্বাচিত। মাটির উর্বরতা রক্ষা ও ডাল উৎপাদনে এটি অত্যন্ত উপযোগী। এটি সাধারণ আঞ্চলিক দিকনির্দেশনা, কোনো নির্দিষ্ট খামারের যাচাইকৃত পূর্বাভাস নয়—উপজেলা কৃষি কর্মকর্তার পরামর্শ নিন।",
                seasonDetailsBn = "খরিপ-২ (বর্ষা) ➔ রবি (শীত) ➔ খরিপ-১ (প্রাক-বর্ষা)",
                riskLevelBn = "খুব কম ঝুঁকি (অতিরিক্ত সেচ লাগে না)",
                titleEn = "Regional Guideline: Soil Health & Legume Cycle (Aman → Mungbean → Aus)",
                sequenceEn = "T. Aman Rice  ➔  Mungbean / Lentil  ➔  T. Aus Rice",
                soilBenefitEn = "Symbiotic root nodules fix atmospheric nitrogen, enhancing natural soil fertility.",
                whySuitableEn = "Selected from general BARC AEZ regional patterns. Natural nitrogen enrichment for rainfed lands. General regional guidance only, not a verified field-specific recommendation. Consult your Upazila Agriculture Officer.",
                seasonDetailsEn = "Kharif-2 (Monsoon) ➔ Rabi (Winter) ➔ Kharif-1 (Pre-monsoon)",
                riskLevelEn = "Very Low Risk (minimal irrigation needed)",
                isFeasible = true,
                suitabilityScore = 0.0,
                suitabilityTier = "Regional Guideline",
                constraints = emptyList(),
                scientificBasis = "BARC Fertilizer Recommendation Guide 2024 (FRG-2024 Section 8.4, pp. 68-72) & BARI Pulses Division",
                isOfflineGuidance = true
            )
        )

        // Relevance ordering:
        // If irrigated: Plan B (Potato/Maize) and Plan A (Mustard/Boro) first
        // If rainfed: Plan D (Legume) and Plan C (Jute/Wheat) first, with Plan A at bottom due to water deficit
        return if (hasIrrigation) {
            listOf(allPlans[1], allPlans[0], allPlans[3], allPlans[2])
        } else {
            listOf(allPlans[3], allPlans[2], allPlans[1], allPlans[0])
        }
    }

    fun getComparisonItems(plans: List<CropRotationPlan>, lang: String = "bn"): List<PlanComparisonItem> {
        return plans.map { plan ->
            val rating = when {
                !plan.isFeasible -> if (lang == "en") "Infeasible (Caution)" else "অনুপযোগী (সতর্কতা)"
                plan.isOfflineGuidance -> if (lang == "en") "Regional Guidance" else "আঞ্চলিক নির্দেশিকা"
                plan.climateSuitabilityPercent >= 90 -> if (lang == "en") "Excellent (A+)" else "অসাধারণ (A+)"
                plan.climateSuitabilityPercent >= 85 -> if (lang == "en") "Very Good (A)" else "খুব ভালো (A)"
                else -> if (lang == "en") "Good (B+)" else "ভালো (B+)"
            }

            val highlightBn = if (!plan.isFeasible && plan.constraints.isNotEmpty()) {
                plan.constraints.first()
            } else if (plan.isOfflineGuidance) {
                "বার্ক (BARC) এইজেড সাধারণ চক্র"
            } else when (plan.id) {
                "pattern_aman_potato_maize", "plan_b_potato_maize" -> "সবচেয়ে বেশি লাভ ও পানি সাশ্রয়"
                "pattern_aman_mustard_boro", "plan_a_mustard_paddy" -> "নিবিড় উৎপাদন ও দ্রুত ঘরে ফসল"
                "pattern_jute_aman_wheat", "plan_c_jute_wheat" -> "শুষ্ক অঞ্চলে পানির সর্বোচ্চ সাশ্রয়"
                "pattern_aman_mustard_mungbean" -> "তৈল ও ডাল মিশ্রিত পুষ্টিচক্র"
                else -> "মাটির স্বাস্থ্য ও সারের খরচ হ্রাস"
            }

            val highlightEn = if (!plan.isFeasible && plan.constraints.isNotEmpty()) {
                plan.constraints.first()
            } else if (plan.isOfflineGuidance) {
                "BARC AEZ General Regional Cycle"
            } else when (plan.id) {
                "pattern_aman_potato_maize", "plan_b_potato_maize" -> "Commercial Cash Crop & Water Efficiency"
                "pattern_aman_mustard_boro", "plan_a_mustard_paddy" -> "Quick Cash Crop & Triple Harvest"
                "pattern_jute_aman_wheat", "plan_c_jute_wheat" -> "Maximum Groundwater Conservation"
                "pattern_aman_mustard_mungbean" -> "Oilseed & Pulse Nutrient Enrichment"
                else -> "Natural Nitrogen Enrichment & Low Cost"
            }

            PlanComparisonItem(
                planId = plan.id,
                titleBn = plan.titleBn,
                climateScore = plan.climateSuitabilityPercent,
                waterScore = plan.waterCompatibilityPercent,
                diversityScore = plan.diversityScorePercent,
                overallRating = rating,
                highlightBn = highlightBn,
                titleEn = plan.titleEn,
                highlightEn = highlightEn,
                isFeasible = plan.isFeasible,
                isOfflineGuidance = plan.isOfflineGuidance
            )
        }
    }
}
