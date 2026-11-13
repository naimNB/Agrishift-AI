package com.agrishift.ai.data.api

import com.agrishift.ai.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

object ApiClient {
    // Default base URL for physical device connected via adb reverse, or emulator (10.0.2.2)
    @Volatile
    var baseUrl: String = "http://127.0.0.1:8000"

    private const val CONNECT_TIMEOUT = 10_000
    private const val READ_TIMEOUT = 25_000

    private fun makeGetRequest(endpoint: String): String {
        if (baseUrl.isBlank()) throw IllegalStateException("Backend server is not configured")
        val fullUrl = "$baseUrl$endpoint"
        val url = URL(fullUrl)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = CONNECT_TIMEOUT
            readTimeout = READ_TIMEOUT
            setRequestProperty("Accept", "application/json")
        }

        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            ?: throw Exception("HTTP $code without response stream")
        val reader = BufferedReader(InputStreamReader(stream))
        val sb = StringBuilder()
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            sb.append(line)
        }
        reader.close()
        conn.disconnect()

        if (code !in 200..299) {
            throw Exception("HTTP $code: $sb")
        }
        return sb.toString()
    }

    private fun makePostRequest(endpoint: String, jsonBody: String): String {
        if (baseUrl.isBlank()) throw IllegalStateException("Backend server is not configured")
        val fullUrl = "$baseUrl$endpoint"
        val url = URL(fullUrl)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = CONNECT_TIMEOUT
            readTimeout = READ_TIMEOUT
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            doOutput = true
        }

        conn.outputStream.use { os ->
            os.write(jsonBody.toByteArray(Charsets.UTF_8))
        }

        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            ?: throw Exception("HTTP $code without response stream")
        val reader = BufferedReader(InputStreamReader(stream))
        val sb = StringBuilder()
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            sb.append(line)
        }
        reader.close()
        conn.disconnect()

        if (code !in 200..299) {
            throw Exception("HTTP $code: $sb")
        }
        return sb.toString()
    }

    suspend fun testConnection(): Boolean = withContext(Dispatchers.IO) {
        if (baseUrl.isBlank()) return@withContext false
        try {
            val response = makeGetRequest("/health")
            val json = JSONObject(response)
            json.optString("status") == "ok"
        } catch (_: Exception) {
            false
        }
    }

    suspend fun fetchDistricts(): Result<List<District>> = withContext(Dispatchers.IO) {
        try {
            val raw = makeGetRequest("/api/nasa/districts")
            val obj = JSONObject(raw)
            val distArray = obj.getJSONArray("districts")
            val list = mutableListOf<District>()

            val banglaNames = mapOf(
                "bogura" to "বগুড়া",
                "rangpur" to "রংপুর",
                "dinajpur" to "দিনাজপুর",
                "rajshahi" to "রাজশাহী",
                "sylhet" to "সিলেট"
            )

            val coords = mapOf(
                "bogura" to Pair(24.8465, 89.3773),
                "rangpur" to Pair(25.7439, 89.2752),
                "dinajpur" to Pair(25.6279, 88.6338),
                "rajshahi" to Pair(24.3636, 88.6241),
                "sylhet" to Pair(24.8949, 91.8687)
            )

            for (i in 0 until distArray.length()) {
                val id = distArray.getString(i).lowercase().trim()
                val (lat, lon) = coords[id] ?: Pair(24.8465, 89.3773)
                val bnName = banglaNames[id] ?: id.replaceFirstChar { it.uppercase() }
                list.add(
                    District(
                        id = id,
                        nameEn = id.replaceFirstChar { it.uppercase() },
                        nameBn = bnName,
                        latitude = lat,
                        longitude = lon,
                        region = if (id == "sylhet") "সিলেট অঞ্চল" else "উত্তরাঞ্চল"
                    )
                )
            }
            Result.success(list)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchClimate(district: String, lat: Double? = null, lon: Double? = null): Result<NasaClimateResponse> =
        withContext(Dispatchers.IO) {
            try {
                val endpoint = if (lat != null && lon != null) {
                    "/api/nasa/climate?latitude=$lat&longitude=$lon"
                } else {
                    "/api/nasa/climate?district=${district.lowercase().trim()}"
                }

                val raw = makeGetRequest(endpoint)
                val root = JSONObject(raw)

                val summaryObj = root.optJSONObject("summary")
                val summary = if (summaryObj != null) {
                    NasaClimateSummary(
                        avgTemperature = summaryObj.optDouble("avg_temperature", Double.NaN).takeIf { !it.isNaN() },
                        maxTemperature = summaryObj.optDouble("max_temperature", Double.NaN).takeIf { !it.isNaN() },
                        minTemperature = summaryObj.optDouble("min_temperature", Double.NaN).takeIf { !it.isNaN() },
                        totalPrecipitation = summaryObj.optDouble("total_precipitation", Double.NaN).takeIf { !it.isNaN() },
                        avgHumidity = summaryObj.optDouble("avg_humidity", Double.NaN).takeIf { !it.isNaN() },
                        avgSolarRadiation = summaryObj.optDouble("avg_solar_radiation", Double.NaN).takeIf { !it.isNaN() },
                        avgWindSpeed = summaryObj.optDouble("avg_wind_speed", Double.NaN).takeIf { !it.isNaN() },
                        avgSoilMoisture = summaryObj.optDouble("avg_soil_moisture", Double.NaN).takeIf { !it.isNaN() }
                    )
                } else {
                    NasaClimateSummary(null, null, null, null, null, null, null, null)
                }

                val dataArray = root.optJSONArray("data") ?: JSONArray()
                val dailyList = mutableListOf<NasaClimateDaily>()
                for (i in 0 until dataArray.length()) {
                    val item = dataArray.getJSONObject(i)
                    dailyList.add(
                        NasaClimateDaily(
                            date = item.optString("date"),
                            tempAvg = item.optDouble("temp_avg", Double.NaN).takeIf { !it.isNaN() },
                            tempMax = item.optDouble("temp_max", Double.NaN).takeIf { !it.isNaN() },
                            tempMin = item.optDouble("temp_min", Double.NaN).takeIf { !it.isNaN() },
                            precipitation = item.optDouble("precipitation", Double.NaN).takeIf { !it.isNaN() },
                            humidity = item.optDouble("humidity", Double.NaN).takeIf { !it.isNaN() },
                            solarRad = item.optDouble("solar_rad", Double.NaN).takeIf { !it.isNaN() },
                            windSpeed = item.optDouble("wind_speed", Double.NaN).takeIf { !it.isNaN() },
                            soilMoisture = item.optDouble("soil_moisture", Double.NaN).takeIf { !it.isNaN() }
                        )
                    )
                }

                val resp = NasaClimateResponse(
                    district = root.optString("district", district),
                    displayName = root.optString("display_name", district.replaceFirstChar { it.uppercase() }),
                    latitude = root.optDouble("latitude", lat ?: 24.8465),
                    longitude = root.optDouble("longitude", lon ?: 89.3773),
                    isCustomCoords = root.optBoolean("is_custom_coords", false),
                    startDate = root.optString("start_date", ""),
                    endDate = root.optString("end_date", ""),
                    source = root.optString("source", "NASA POWER Daily Agroclimatology"),
                    data = dailyList,
                    summary = summary
                )
                Result.success(resp)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun fetchAdvisories(district: String): Result<FarmerAdvisoryResponse> = withContext(Dispatchers.IO) {
        try {
            val endpoint = "/api/advisory?district=${district.lowercase().trim()}"
            val raw = makeGetRequest(endpoint)
            val root = JSONObject(raw)

            val advisoriesArray = root.optJSONArray("advisories") ?: JSONArray()
            val advList = mutableListOf<FarmerAdvisoryItem>()
            for (i in 0 until advisoriesArray.length()) {
                val itm = advisoriesArray.getJSONObject(i)
                val metricsObj = itm.optJSONObject("context_metrics")
                val metricMap = mutableMapOf<String, String>()
                metricsObj?.keys()?.forEach { k ->
                    metricMap[k] = metricsObj.optString(k)
                }

                advList.add(
                    FarmerAdvisoryItem(
                        category = itm.optString("category", "general"),
                        title = itm.optString("title", ""),
                        titleBn = itm.optString("title_bn", itm.optString("title")),
                        message = itm.optString("message", ""),
                        messageBn = itm.optString("message_bn", itm.optString("message")),
                        priority = itm.optString("priority", "routine"),
                        icon = itm.optString("icon", "info"),
                        contextMetrics = metricMap
                    )
                )
            }

            val topCropObj = root.optJSONObject("top_recommended_crop")
            val topCrop = topCropObj?.optString("display_name") ?: "ধান"

            Result.success(
                FarmerAdvisoryResponse(
                    district = root.optString("district", district),
                    displayName = root.optString("display_name", district),
                    assessmentDate = root.optString("assessment_date", ""),
                    seasonContext = root.optString("season_context", ""),
                    advisories = advList,
                    topRecommendedCrop = topCrop
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchCropRotations(
        district: String,
        currentCrop: String,
        season: String = "rabi",
        soilType: String = "loam",
        hasIrrigation: Boolean = true,
        lat: Double? = null,
        lon: Double? = null
    ): Result<CropRotationApiResponse> = withContext(Dispatchers.IO) {
        try {
            val jsonPayload = JSONObject().apply {
                put("district", district.lowercase().trim())
                put("current_crop", currentCrop)
                put("season", season)
                put("soil_type", soilType)
                put("has_irrigation", hasIrrigation)
                if (lat != null) put("latitude", lat)
                if (lon != null) put("longitude", lon)
            }

            val raw = makePostRequest("/api/rotations/recommend", jsonPayload.toString())
            val root = JSONObject(raw)

            val plansArray = root.optJSONArray("recommended_rotations") ?: JSONArray()
            val planList = mutableListOf<CropRotationPlan>()

            for (i in 0 until plansArray.length()) {
                val itm = plansArray.getJSONObject(i)
                val cropsArr = itm.optJSONArray("crops") ?: JSONArray()
                val cropNames = mutableListOf<String>()
                for (j in 0 until cropsArr.length()) {
                    cropNames.add(cropsArr.getString(j))
                }

                val constraintsArr = itm.optJSONArray("constraints") ?: JSONArray()
                val constraintList = mutableListOf<String>()
                for (k in 0 until constraintsArr.length()) {
                    constraintList.add(constraintsArr.getString(k))
                }

                planList.add(
                    CropRotationPlan(
                        id = itm.optString("id"),
                        titleBn = itm.optString("title_bn"),
                        sequenceBn = itm.optString("sequence_bn"),
                        crops = cropNames,
                        climateSuitability = itm.optString("overall_rating"),
                        climateSuitabilityPercent = itm.optInt("climate_suitability_score", 85),
                        waterRequirement = itm.optString("water_regime_bn"),
                        waterCompatibilityPercent = itm.optInt("water_compatibility_score", 80),
                        diversityScore = itm.optString("suitability_tier"),
                        diversityScorePercent = itm.optInt("diversity_score", 90),
                        soilBenefitBn = itm.optString("soil_benefit_bn"),
                        whySuitableBn = itm.optString("why_suitable_bn"),
                        seasonDetailsBn = itm.optString("water_regime_bn"),
                        riskLevelBn = itm.optString("risk_level_bn"),
                        titleEn = itm.optString("title_en"),
                        sequenceEn = itm.optString("sequence_en"),
                        soilBenefitEn = itm.optString("soil_benefit_en"),
                        whySuitableEn = itm.optString("why_suitable_en"),
                        seasonDetailsEn = itm.optString("water_regime_en"),
                        riskLevelEn = itm.optString("risk_level_en"),
                        isFeasible = itm.optBoolean("is_feasible", true),
                        suitabilityScore = itm.optDouble("suitability_score", 0.85),
                        suitabilityTier = itm.optString("suitability_tier", "High"),
                        constraints = constraintList,
                        scientificBasis = itm.optString("scientific_basis")
                    )
                )
            }

            val dataSourcesArr = root.optJSONArray("data_sources") ?: JSONArray()
            val sources = mutableListOf<String>()
            for (i in 0 until dataSourcesArr.length()) {
                sources.add(dataSourcesArr.getString(i))
            }

            Result.success(
                CropRotationApiResponse(
                    district = root.optString("district", district),
                    displayName = root.optString("display_name", district),
                    hasIrrigation = root.optBoolean("has_irrigation", hasIrrigation),
                    soilType = root.optString("soil_type", soilType),
                    currentCrop = root.optString("current_crop", currentCrop),
                    seasonContext = root.optString("season_context", season),
                    telemetrySource = root.optString("telemetry_source", "NASA POWER"),
                    isFallbackTelemetry = root.optBoolean("is_fallback_telemetry", false),
                    recommendedRotations = planList,
                    dataSources = sources,
                    scientificAssumptionsAndLimitations = root.optString("scientific_assumptions_and_limitations", "")
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
