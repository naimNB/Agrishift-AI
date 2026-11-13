package com.agrishift.ai.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.agrishift.ai.data.api.ApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AppPreferencesRepository(context: Context? = null) {

    companion object {
        const val SERVER_NOT_CONFIGURED = ""
        const val PRESET_EMULATOR = "http://10.0.2.2:8000"
        const val PRESET_ADB_REVERSE = "http://127.0.0.1:8000"
    }

    private val prefs: SharedPreferences? = context?.getSharedPreferences("agrishift_app_prefs", Context.MODE_PRIVATE)

    private val _language = MutableStateFlow(prefs?.getString("app_language", "bn") ?: "bn")
    val language: StateFlow<String> = _language.asStateFlow()

    private val _showRotationShortcut = MutableStateFlow(prefs?.getBoolean("show_rotation_shortcut", true) ?: true)
    val showRotationShortcut: StateFlow<Boolean> = _showRotationShortcut.asStateFlow()

    private val _showClimateShortcut = MutableStateFlow(prefs?.getBoolean("show_climate_shortcut", true) ?: true)
    val showClimateShortcut: StateFlow<Boolean> = _showClimateShortcut.asStateFlow()

    private val _showCompareShortcut = MutableStateFlow(prefs?.getBoolean("show_compare_shortcut", true) ?: true)
    val showCompareShortcut: StateFlow<Boolean> = _showCompareShortcut.asStateFlow()

    private val _showAdvisoryShortcut = MutableStateFlow(prefs?.getBoolean("show_advisory_shortcut", true) ?: true)
    val showAdvisoryShortcut: StateFlow<Boolean> = _showAdvisoryShortcut.asStateFlow()

    private val _backendUrl = MutableStateFlow(
        prefs?.getString("backend_url", ApiClient.baseUrl) ?: ApiClient.baseUrl
    )
    val backendUrl: StateFlow<String> = _backendUrl.asStateFlow()

    init {
        val savedUrl = prefs?.getString("backend_url", null)
        if (savedUrl != null) {
            val clean = savedUrl.trim().removeSuffix("/")
            ApiClient.baseUrl = clean
            _backendUrl.value = clean
        }
    }

    fun setLanguage(lang: String) {
        val validLang = if (lang == "en") "en" else "bn"
        _language.value = validLang
        prefs?.edit()?.putString("app_language", validLang)?.apply()
    }

    fun setShowRotationShortcut(show: Boolean) {
        _showRotationShortcut.value = show
        prefs?.edit()?.putBoolean("show_rotation_shortcut", show)?.apply()
    }

    fun setShowClimateShortcut(show: Boolean) {
        _showClimateShortcut.value = show
        prefs?.edit()?.putBoolean("show_climate_shortcut", show)?.apply()
    }

    fun setShowCompareShortcut(show: Boolean) {
        _showCompareShortcut.value = show
        prefs?.edit()?.putBoolean("show_compare_shortcut", show)?.apply()
    }

    fun setShowAdvisoryShortcut(show: Boolean) {
        _showAdvisoryShortcut.value = show
        prefs?.edit()?.putBoolean("show_advisory_shortcut", show)?.apply()
    }

    fun setBackendUrl(url: String) {
        val clean = url.trim().removeSuffix("/")
        _backendUrl.value = clean
        ApiClient.baseUrl = clean
        prefs?.edit()?.putString("backend_url", clean)?.apply()
    }

    fun resetToDefaults() {
        setLanguage("bn")
        setShowRotationShortcut(true)
        setShowClimateShortcut(true)
        setShowCompareShortcut(true)
        setShowAdvisoryShortcut(true)
        setBackendUrl(PRESET_ADB_REVERSE)
    }
}
