package com.agrishift.ai.data.repository

import com.agrishift.ai.data.api.ApiClient
import com.agrishift.ai.data.model.FarmerAdvisoryResponse
import com.agrishift.ai.data.model.NasaClimateResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class ClimateUiState {
    object Idle : ClimateUiState()
    object Loading : ClimateUiState()
    data class Success(
        val climate: NasaClimateResponse,
        val advisories: FarmerAdvisoryResponse? = null
    ) : ClimateUiState()
    data class Error(val messageBn: String, val rawError: String? = null) : ClimateUiState()
}

class ClimateRepository {

    private val _climateState = MutableStateFlow<ClimateUiState>(ClimateUiState.Idle)
    val climateState: StateFlow<ClimateUiState> = _climateState.asStateFlow()

    private var cachedDistrict: String? = null
    private var cachedClimate: NasaClimateResponse? = null
    private var cachedAdvisories: FarmerAdvisoryResponse? = null

    suspend fun loadClimate(district: String, lat: Double? = null, lon: Double? = null, forceRefresh: Boolean = false) {
        val normDistrict = district.lowercase().trim()

        if (!forceRefresh && normDistrict == cachedDistrict && cachedClimate != null) {
            _climateState.value = ClimateUiState.Success(cachedClimate!!, cachedAdvisories)
            return
        }

        _climateState.value = ClimateUiState.Loading

        val climateResult = ApiClient.fetchClimate(normDistrict, lat, lon)
        if (climateResult.isSuccess) {
            val climateData = climateResult.getOrNull()!!
            cachedDistrict = normDistrict
            cachedClimate = climateData

            // Also attempt to fetch advisories
            val advResult = ApiClient.fetchAdvisories(normDistrict)
            val advData = advResult.getOrNull()
            cachedAdvisories = advData

            _climateState.value = ClimateUiState.Success(climateData, advData)
        } else {
            val ex = climateResult.exceptionOrNull()
            val messageBn = when {
                ex?.message?.contains("Failed to connect") == true || ex?.message?.contains("ECONNREFUSED") == true ->
                    "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে নিশ্চিত করুন ব্যাকএন্ড সার্ভার সচল আছে।"
                ex?.message?.contains("timeout") == true ->
                    "NASA সার্ভার থেকে তথ্য পেতে বেশি সময় লাগছে। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।"
                else ->
                    "NASA জলবায়ু তথ্য লোড করতে সমস্যা হয়েছে: ${ex?.localizedMessage ?: "অজ্ঞাত ত্রুটি"}"
            }
            _climateState.value = ClimateUiState.Error(messageBn, ex?.message)
        }
    }
}
