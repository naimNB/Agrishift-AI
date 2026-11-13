package com.agrishift.ai.data.repository

import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class FarmRepositoryTest {

    private lateinit var farmRepository: FarmRepository

    @Before
    fun setUp() {
        farmRepository = FarmRepository(null) // null context uses memory default
    }

    @Test
    fun testDefaultFarmProfileInitialization() {
        val profile = farmRepository.farmProfile.value
        assertEquals("bogura", profile.districtId)
        assertEquals("বগুড়া", profile.districtNameBn)
        assertTrue(profile.hasIrrigation)
        assertEquals(24.8465, profile.latitude, 0.001)
        assertEquals(89.3773, profile.longitude, 0.001)
    }

    @Test
    fun testDefaultDistrictsAvailability() {
        val districts = FarmRepository.DEFAULT_DISTRICTS
        assertEquals(5, districts.size)
        val districtIds = districts.map { it.id }
        assertTrue(districtIds.contains("bogura"))
        assertTrue(districtIds.contains("rangpur"))
        assertTrue(districtIds.contains("dinajpur"))
        assertTrue(districtIds.contains("rajshahi"))
        assertTrue(districtIds.contains("sylhet"))
    }

    @Test
    fun testCropOptionsAvailable() {
        val crops = FarmRepository.CROP_OPTIONS
        assertTrue(crops.isNotEmpty())
        assertTrue(crops.any { it.contains("ধান") })
        assertTrue(crops.any { it.contains("গম") })
        assertTrue(crops.any { it.contains("ভুট্টা") })
        assertTrue(crops.any { it.contains("আলু") })
    }

    @Test
    fun testUpdateCoordinates() {
        farmRepository.updateCoordinates(25.7439, 89.2752) // Rangpur coords
        val updated = farmRepository.farmProfile.value
        assertEquals(25.7439, updated.latitude, 0.0001)
        assertEquals(89.2752, updated.longitude, 0.0001)
    }
}
