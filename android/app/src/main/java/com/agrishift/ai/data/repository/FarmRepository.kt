package com.agrishift.ai.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.agrishift.ai.data.model.District
import com.agrishift.ai.data.model.FarmProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FarmRepository(context: Context? = null) {

    private val prefs: SharedPreferences? = context?.getSharedPreferences("agrishift_farm_prefs", Context.MODE_PRIVATE)

    private val _farmProfile = MutableStateFlow(loadInitialProfile())
    val farmProfile: StateFlow<FarmProfile> = _farmProfile.asStateFlow()

    companion object {
        val DEFAULT_DISTRICTS = listOf(
            District("bogura", "Bogura", "বগুড়া", 24.8465, 89.3773, "উত্তরাঞ্চল কৃষি হাব"),
            District("rangpur", "Rangpur", "রংপুর", 25.7439, 89.2752, "তিস্তা অববাহিকা"),
            District("dinajpur", "Dinajpur", "দিনাজপুর", 25.6279, 88.6338, "উত্তরের সমভূমি"),
            District("rajshahi", "Rajshahi", "রাজশাহী", 24.3636, 88.6241, "উচ্চ বরেন্দ্র অঞ্চল"),
            District("sylhet", "Sylhet", "সিলেট", 24.8949, 91.8687, "সুরমা অববাহিকা")
        )

        val CROP_OPTIONS = listOf(
            "ধান (বোরো/আমন)",
            "গম",
            "ভুট্টা",
            "আলু",
            "সরিষা",
            "পাট",
            "ডাল / মুগডাল",
            "শাকসবজি"
        )

        val SOIL_OPTIONS = listOf(
            "দোআঁশ মাটি (সব ফসলের জন্য উত্তম)",
            "বেলে-দোআঁশ মাটি (আলু, ভুট্টা ও বাদাম উপযোগী)",
            "এঁটেল মাটি (ধান চাষের জন্য উত্তম)",
            "পলিমাটি (উর্বর চর ও নদী তীরবর্তী)"
        )

        val SEASON_OPTIONS = listOf(
            "রবি মৌসুম (শীতকালীন: কার্তিক - ফাল্গুন)",
            "খরিপ-১ মৌসুম (প্রাক-বর্ষা: চৈত্র - জ্যৈষ্ঠ)",
            "খরিপ-২ মৌসুম (বর্ষাকালীন: আষাঢ় - আশ্বিন)"
        )
    }

    private fun loadInitialProfile(): FarmProfile {
        if (prefs == null) {
            return FarmProfile()
        }
        val districtId = prefs.getString("district_id", "bogura") ?: "bogura"
        val districtNameBn = prefs.getString("district_name_bn", "বগুড়া") ?: "বগুড়া"
        val lat = prefs.getFloat("lat", 24.8465f).toDouble()
        val lon = prefs.getFloat("lon", 89.3773f).toDouble()
        val crop = prefs.getString("crop", "ধান (বোরো/আমন)") ?: "ধান (বোরো/আমন)"
        val season = prefs.getString("season", "রবি মৌসুম (শীতকালীন: কার্তিক - ফাল্গুন)")
            ?: "রবি মৌসুম (শীতকালীন: কার্তিক - ফাল্গুন)"
        val soil = prefs.getString("soil", "দোআঁশ মাটি (সব ফসলের জন্য উত্তম)") ?: "দোআঁশ মাটি (সব ফসলের জন্য উত্তম)"
        val irrigation = prefs.getBoolean("irrigation", true)
        val area = prefs.getString("area", "৩ বিঘা") ?: "৩ বিঘা"
        val updated = prefs.getLong("updated", System.currentTimeMillis())

        return FarmProfile(
            districtId = districtId,
            districtNameBn = districtNameBn,
            latitude = lat,
            longitude = lon,
            currentCrop = crop,
            season = season,
            soilType = soil,
            hasIrrigation = irrigation,
            areaBigha = area,
            lastUpdated = updated
        )
    }

    fun saveFarmProfile(profile: FarmProfile) {
        _farmProfile.value = profile
        prefs?.edit()?.apply {
            putString("district_id", profile.districtId)
            putString("district_name_bn", profile.districtNameBn)
            putFloat("lat", profile.latitude.toFloat())
            putFloat("lon", profile.longitude.toFloat())
            putString("crop", profile.currentCrop)
            putString("season", profile.season)
            putString("soil", profile.soilType)
            putBoolean("irrigation", profile.hasIrrigation)
            putString("area", profile.areaBigha)
            putLong("updated", System.currentTimeMillis())
            apply()
        }
    }

    fun updateCoordinates(lat: Double, lon: Double) {
        val current = _farmProfile.value
        val updated = current.copy(
            latitude = lat,
            longitude = lon,
            lastUpdated = System.currentTimeMillis()
        )
        saveFarmProfile(updated)
    }
}
