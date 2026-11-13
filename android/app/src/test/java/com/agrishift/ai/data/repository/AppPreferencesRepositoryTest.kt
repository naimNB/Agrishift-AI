package com.agrishift.ai.data.repository

import com.agrishift.ai.data.api.ApiClient
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AppPreferencesRepositoryTest {

    private lateinit var appPreferencesRepository: AppPreferencesRepository

    @Before
    fun setUp() {
        appPreferencesRepository = AppPreferencesRepository(null) // null context uses memory defaults
    }

    @Test
    fun testDefaultLanguageIsBangla() {
        assertEquals("bn", appPreferencesRepository.language.value)
    }

    @Test
    fun testLanguageToggle() {
        appPreferencesRepository.setLanguage("en")
        assertEquals("en", appPreferencesRepository.language.value)

        appPreferencesRepository.setLanguage("bn")
        assertEquals("bn", appPreferencesRepository.language.value)

        // Invalid fallback
        appPreferencesRepository.setLanguage("fr")
        assertEquals("bn", appPreferencesRepository.language.value)
    }

    @Test
    fun testDefaultDashboardShortcutsAreTrue() {
        assertTrue(appPreferencesRepository.showRotationShortcut.value)
        assertTrue(appPreferencesRepository.showClimateShortcut.value)
        assertTrue(appPreferencesRepository.showCompareShortcut.value)
        assertTrue(appPreferencesRepository.showAdvisoryShortcut.value)
    }

    @Test
    fun testDashboardCustomizationToggles() {
        appPreferencesRepository.setShowRotationShortcut(false)
        assertFalse(appPreferencesRepository.showRotationShortcut.value)

        appPreferencesRepository.setShowClimateShortcut(false)
        assertFalse(appPreferencesRepository.showClimateShortcut.value)

        appPreferencesRepository.resetToDefaults()
        assertTrue(appPreferencesRepository.showRotationShortcut.value)
        assertTrue(appPreferencesRepository.showClimateShortcut.value)
        assertEquals("bn", appPreferencesRepository.language.value)
    }

    @Test
    fun testConfigurableBackendUrl() {
        assertEquals(ApiClient.baseUrl, appPreferencesRepository.backendUrl.value)

        // Switch to Not Configured
        appPreferencesRepository.setBackendUrl(AppPreferencesRepository.SERVER_NOT_CONFIGURED)
        assertEquals(AppPreferencesRepository.SERVER_NOT_CONFIGURED, appPreferencesRepository.backendUrl.value)
        assertEquals("", ApiClient.baseUrl)

        // Switch to Emulator Dev
        appPreferencesRepository.setBackendUrl(AppPreferencesRepository.PRESET_EMULATOR)
        assertEquals(AppPreferencesRepository.PRESET_EMULATOR, appPreferencesRepository.backendUrl.value)
        assertEquals(AppPreferencesRepository.PRESET_EMULATOR, ApiClient.baseUrl)

        // Switch to custom LAN IP with trailing slash (should be trimmed)
        appPreferencesRepository.setBackendUrl("http://192.168.1.50:8000/")
        assertEquals("http://192.168.1.50:8000", appPreferencesRepository.backendUrl.value)
        assertEquals("http://192.168.1.50:8000", ApiClient.baseUrl)

        // Reset to defaults
        appPreferencesRepository.resetToDefaults()
        assertEquals(AppPreferencesRepository.PRESET_ADB_REVERSE, appPreferencesRepository.backendUrl.value)
    }
}
