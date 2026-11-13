package com.agrishift.ai.data.model

data class District(
    val id: String,
    val nameEn: String,
    val nameBn: String,
    val latitude: Double,
    val longitude: Double,
    val region: String = "উত্তরাঞ্চল"
) {
    fun getName(lang: String): String = if (lang == "en") nameEn else nameBn
}

data class FarmProfile(
    val districtId: String = "bogura",
    val districtNameBn: String = "বগুড়া",
    val latitude: Double = 24.8465,
    val longitude: Double = 89.3773,
    val currentCrop: String = "ধান",
    val season: String = "রবি (শীতকালীন)",
    val soilType: String = "দোআঁশ মাটি",
    val hasIrrigation: Boolean = true,
    val areaBigha: String = "৩ বিঘা",
    val lastUpdated: Long = System.currentTimeMillis()
)

data class NasaClimateDaily(
    val date: String,
    val tempAvg: Double?,
    val tempMax: Double?,
    val tempMin: Double?,
    val precipitation: Double?,
    val humidity: Double?,
    val solarRad: Double?,
    val windSpeed: Double?,
    val soilMoisture: Double? // GWETROOT (0.0 - 1.0)
)

data class NasaClimateSummary(
    val avgTemperature: Double?,
    val maxTemperature: Double?,
    val minTemperature: Double?,
    val totalPrecipitation: Double?,
    val avgHumidity: Double?,
    val avgSolarRadiation: Double?,
    val avgWindSpeed: Double?,
    val avgSoilMoisture: Double?
)

data class NasaClimateResponse(
    val district: String,
    val displayName: String,
    val latitude: Double,
    val longitude: Double,
    val isCustomCoords: Boolean,
    val startDate: String,
    val endDate: String,
    val source: String,
    val data: List<NasaClimateDaily>,
    val summary: NasaClimateSummary
)

data class FarmerAdvisoryItem(
    val category: String,
    val title: String,
    val titleBn: String,
    val message: String,
    val messageBn: String,
    val priority: String, // urgent, actionable, routine
    val icon: String,
    val contextMetrics: Map<String, String> = emptyMap()
) {
    fun getTitle(lang: String): String = if (lang == "en" && title.isNotBlank()) title else titleBn
    fun getMessage(lang: String): String = if (lang == "en" && message.isNotBlank()) message else messageBn
}

data class FarmerAdvisoryResponse(
    val district: String,
    val displayName: String,
    val assessmentDate: String,
    val seasonContext: String,
    val advisories: List<FarmerAdvisoryItem>,
    val topRecommendedCrop: String = "ধান"
)

data class CropRotationPlan(
    val id: String,
    val titleBn: String,
    val sequenceBn: String,
    val crops: List<String>,
    val climateSuitability: String, // উচ্চ, মধ্যম, অত্যন্ত অনুকূল
    val climateSuitabilityPercent: Int,
    val waterRequirement: String,   // কম পানি লাগে, মাঝারি সেচ, উচ্চ সেচ
    val waterCompatibilityPercent: Int,
    val diversityScore: String,     // চমৎকার, ভালো, সাধারণ
    val diversityScorePercent: Int,
    val soilBenefitBn: String,
    val whySuitableBn: String,
    val seasonDetailsBn: String,
    val riskLevelBn: String,
    val titleEn: String = "",
    val sequenceEn: String = "",
    val soilBenefitEn: String = "",
    val whySuitableEn: String = "",
    val seasonDetailsEn: String = "",
    val riskLevelEn: String = "",
    val isFeasible: Boolean = true,
    val suitabilityScore: Double = 0.85,
    val suitabilityTier: String = "High",
    val constraints: List<String> = emptyList(),
    val scientificBasis: String = "",
    val isOfflineGuidance: Boolean = false
) {
    fun getTitle(lang: String): String = if (lang == "en" && titleEn.isNotBlank()) titleEn else titleBn
    fun getSequence(lang: String): String = if (lang == "en" && sequenceEn.isNotBlank()) sequenceEn else sequenceBn
    fun getWhySuitable(lang: String): String = if (lang == "en" && whySuitableEn.isNotBlank()) whySuitableEn else whySuitableBn
    fun getSoilBenefit(lang: String): String = if (lang == "en" && soilBenefitEn.isNotBlank()) soilBenefitEn else soilBenefitBn
    fun getSeasonDetails(lang: String): String = if (lang == "en" && seasonDetailsEn.isNotBlank()) seasonDetailsEn else seasonDetailsBn
    fun getRiskLevel(lang: String): String = if (lang == "en" && riskLevelEn.isNotBlank()) riskLevelEn else riskLevelBn
}

data class PlanComparisonItem(
    val planId: String,
    val titleBn: String,
    val climateScore: Int,
    val waterScore: Int,
    val diversityScore: Int,
    val overallRating: String,
    val highlightBn: String,
    val titleEn: String = "",
    val highlightEn: String = "",
    val isFeasible: Boolean = true,
    val isOfflineGuidance: Boolean = false
) {
    fun getTitle(lang: String): String = if (lang == "en" && titleEn.isNotBlank()) titleEn else titleBn
    fun getHighlight(lang: String): String = if (lang == "en" && highlightEn.isNotBlank()) highlightEn else highlightBn
}

data class CropRotationApiResponse(
    val district: String,
    val displayName: String,
    val hasIrrigation: Boolean,
    val soilType: String,
    val currentCrop: String,
    val seasonContext: String,
    val telemetrySource: String,
    val isFallbackTelemetry: Boolean,
    val recommendedRotations: List<CropRotationPlan>,
    val dataSources: List<String>,
    val scientificAssumptionsAndLimitations: String
)
