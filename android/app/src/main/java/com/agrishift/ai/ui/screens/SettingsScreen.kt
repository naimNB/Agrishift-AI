package com.agrishift.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrishift.ai.data.api.ApiClient
import com.agrishift.ai.data.model.AppStrings
import com.agrishift.ai.data.repository.AppPreferencesRepository
import com.agrishift.ai.ui.components.*
import com.agrishift.ai.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    appPreferencesRepository: AppPreferencesRepository,
    onBack: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val lang by appPreferencesRepository.language.collectAsState()
    val showRotations by appPreferencesRepository.showRotationShortcut.collectAsState()
    val showClimate by appPreferencesRepository.showClimateShortcut.collectAsState()
    val showCompare by appPreferencesRepository.showCompareShortcut.collectAsState()
    val showAdvisory by appPreferencesRepository.showAdvisoryShortcut.collectAsState()
    val backendUrl by appPreferencesRepository.backendUrl.collectAsState()

    var customUrlInput by remember(backendUrl) { mutableStateOf(backendUrl) }
    var urlSavedMessage by remember { mutableStateOf<String?>(null) }
    var isCheckingConnection by remember { mutableStateOf(false) }
    var connectionStatus by remember { mutableStateOf<String?>(null) }
    var isConnectionOk by remember { mutableStateOf<Boolean?>(null) }

    Scaffold(
        topBar = {
            AgriTopBar(
                title = AppStrings.settingsScreenTitle(lang),
                subtitle = AppStrings.settingsScreenSubtitle(lang),
                onBack = onBack
            )
        },
        containerColor = PaleGreenBg
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Language Preference Section
            AgriCard {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Language, contentDescription = null, tint = ForestGreen)
                    Text(
                        text = AppStrings.languageChoiceTitle(lang),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 15.sp
                        )
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    FilterChip(
                        selected = lang == "bn",
                        onClick = { appPreferencesRepository.setLanguage("bn") },
                        label = { Text("বাংলা (ডিফল্ট)", fontWeight = if (lang == "bn") FontWeight.Bold else FontWeight.Medium) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = LushGreen,
                            selectedLabelColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    )

                    FilterChip(
                        selected = lang == "en",
                        onClick = { appPreferencesRepository.setLanguage("en") },
                        label = { Text("English", fontWeight = if (lang == "en") FontWeight.Bold else FontWeight.Medium) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = LushGreen,
                            selectedLabelColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // 2. Dashboard Customization Section
            AgriCard {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.DashboardCustomize, contentDescription = null, tint = LushGreen)
                    Text(
                        text = AppStrings.dashboardCustomizationTitle(lang),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 15.sp
                        )
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = AppStrings.dashboardCustomizationDesc(lang),
                    style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText)
                )

                Spacer(modifier = Modifier.height(8.dp))

                DashboardToggleItem(
                    title = AppStrings.toggleRotationsShortcut(lang),
                    checked = showRotations,
                    onToggle = { appPreferencesRepository.setShowRotationShortcut(it) }
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = SubtleBorder)

                DashboardToggleItem(
                    title = AppStrings.toggleClimateShortcut(lang),
                    checked = showClimate,
                    onToggle = { appPreferencesRepository.setShowClimateShortcut(it) }
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = SubtleBorder)

                DashboardToggleItem(
                    title = AppStrings.toggleCompareShortcut(lang),
                    checked = showCompare,
                    onToggle = { appPreferencesRepository.setShowCompareShortcut(it) }
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = SubtleBorder)

                DashboardToggleItem(
                    title = AppStrings.toggleAdvisoryBanner(lang),
                    checked = showAdvisory,
                    onToggle = { appPreferencesRepository.setShowAdvisoryShortcut(it) }
                )
            }

            // 3. Data Sources Section
            AgriCard {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.CloudQueue, contentDescription = null, tint = WaterBlue)
                    Text(
                        text = AppStrings.dataSourcesTitle(lang),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 15.sp
                        )
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                SourceItem(
                    title = "NASA POWER Daily Agroclimatology",
                    subtitle = if (lang == "en")
                        "Langley Research Center (LaRC) satellite data providing solar radiation, temperature, precipitation, and Catchment Land Surface root-zone soil wetness."
                    else
                        "যুক্তরাষ্ট্রের নাসা লাংলি রিসার্চ সেন্টারের আর্থ অবজারভেশন স্যাটেলাইট থেকে দৈনিক সৌর বিকিরণ, বৃষ্টিপাত, তাপমাত্রা ও মাটির রুট-জোন আর্দ্রতা সংগ্রহ করা হয়।"
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = SubtleBorder)

                SourceItem(
                    title = if (lang == "en") "Bangladesh Agricultural Research Council (BARC) AEZ" else "বাংলাদেশ কৃষি গবেষণা কাউন্সিল (BARC) AEZ",
                    subtitle = if (lang == "en")
                        "Regional Agro-Ecological Zones guidelines for crop sowing windows, irrigation requirements, and rotation suitability."
                    else
                        "বাংলাদেশের কৃষি-পরিবেশ অঞ্চল (Agro-Ecological Zones) অনুযায়ী উপযোগী ফসলের বপনকাল, সেচ ও আবর্তন নির্দেশিকা অনুসরণ করা হয়েছে।"
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = SubtleBorder)

                SourceItem(
                    title = if (lang == "en") "AgriShift AI Analytics Engine" else "AgriShift AI অ্যানালিটিক্যাল ইঞ্জিন",
                    subtitle = if (lang == "en")
                        "Processes real-time agroclimate telemetry into actionable, explainable farmer advisories."
                    else
                        "রিয়েল-টাইম আবহাওয়া ও মৃত্তিকা আর্দ্রতা বিশ্লেষণ করে কৃষকের জন্য স্বয়ংক্রিয় বাংলা পরামর্শ প্রস্তুত করে।"
                )
            }

            // 4. Privacy Information Section
            AgriCard {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Security, contentDescription = null, tint = ForestGreen)
                    Text(
                        text = AppStrings.privacyTitle(lang),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 15.sp
                        )
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = AppStrings.privacyBulletPoints(lang),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = SlateGrayText,
                        fontSize = 13.sp,
                        lineHeight = 20.sp
                    )
                )
            }

            // 5. Backend Status & Server Configuration
            AgriCard {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.CloudSync, contentDescription = null, tint = ForestGreen)
                    Text(
                        text = AppStrings.backendStatusTitle(lang),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 15.sp
                        )
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = AppStrings.serverConfigTitle(lang),
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText
                    )
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Preset Chips: Cloud (Not Configured), USB Dev (ADB Reverse), Emulator
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = backendUrl.isBlank(),
                        onClick = {
                            customUrlInput = AppPreferencesRepository.SERVER_NOT_CONFIGURED
                            appPreferencesRepository.setBackendUrl(AppPreferencesRepository.SERVER_NOT_CONFIGURED)
                            urlSavedMessage = if (lang == "en") "Cloud server not configured. Operating in offline BARC AEZ mode." else "ক্লাউড সার্ভার কনফিগার করা হয়নি। সাধারণ অফলাইন মোড সক্রিয়।"
                        },
                        label = { Text(AppStrings.presetProductionCloud(lang), fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = ForestGreen,
                            selectedLabelColor = Color.White
                        )
                    )

                    FilterChip(
                        selected = backendUrl == AppPreferencesRepository.PRESET_ADB_REVERSE,
                        onClick = {
                            customUrlInput = AppPreferencesRepository.PRESET_ADB_REVERSE
                            appPreferencesRepository.setBackendUrl(AppPreferencesRepository.PRESET_ADB_REVERSE)
                            urlSavedMessage = if (lang == "en") "USB Dev mode (127.0.0.1:8000 applied)" else "ইউএসবি ডেভ মোড (127.0.0.1:8000 কার্যকর)"
                        },
                        label = { Text(AppStrings.presetAdbReverse(lang), fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = ForestGreen,
                            selectedLabelColor = Color.White
                        )
                    )

                    FilterChip(
                        selected = backendUrl == AppPreferencesRepository.PRESET_EMULATOR,
                        onClick = {
                            customUrlInput = AppPreferencesRepository.PRESET_EMULATOR
                            appPreferencesRepository.setBackendUrl(AppPreferencesRepository.PRESET_EMULATOR)
                            urlSavedMessage = if (lang == "en") "Emulator Dev mode (10.0.2.2:8000 applied)" else "ইমুলেটর ডেভ মোড (10.0.2.2:8000 কার্যকর)"
                        },
                        label = { Text(AppStrings.presetEmulator(lang), fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = ForestGreen,
                            selectedLabelColor = Color.White
                        )
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = customUrlInput,
                    onValueChange = {
                        customUrlInput = it
                        urlSavedMessage = null
                    },
                    label = { Text(AppStrings.serverUrlLabel(lang), fontSize = 12.sp) },
                    placeholder = { Text(if (lang == "en") "https://your-domain.org (HTTPS Required)" else "https://আপনার-ডোমেইন.org (HTTPS প্রয়োজন)") },
                    supportingText = {
                        if (customUrlInput.isBlank()) {
                            Text(
                                text = AppStrings.serverNotConfiguredWarning(lang),
                                color = SlateGrayText,
                                fontSize = 11.sp
                            )
                        } else if (customUrlInput.startsWith("http://") && !customUrlInput.contains("127.0.0.1") && !customUrlInput.contains("localhost") && !customUrlInput.contains("10.0.2.2")) {
                            Text(
                                text = if (lang == "en") "Security Notice: Production release builds require secure HTTPS. Insecure HTTP is blocked." else "নিরাপত্তা সতর্কতা: রিলিজ বিল্ডে সাধারণ HTTP নিষিদ্ধ। HTTPS ব্যবহার আবশ্যক।",
                                color = Color(0xFFE65100),
                                fontSize = 11.sp
                            )
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            appPreferencesRepository.setBackendUrl(customUrlInput)
                            urlSavedMessage = AppStrings.serverUrlSaved(lang)
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(AppStrings.saveServerUrlBtn(lang), fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            if (customUrlInput.isBlank()) {
                                isConnectionOk = false
                                connectionStatus = if (lang == "en")
                                    "No server configured. Operating in offline BARC AEZ regional mode."
                                else
                                    "কোনো সার্ভার ঠিকানা দেওয়া নেই। অ্যাপটি অফলাইন বার্ক (BARC) আঞ্চলিক মোডে পরিচালিত হচ্ছে।"
                                return@OutlinedButton
                            }
                            isCheckingConnection = true
                            connectionStatus = AppStrings.testingServer(lang)
                            coroutineScope.launch {
                                val ok = ApiClient.testConnection()
                                isConnectionOk = ok
                                isCheckingConnection = false
                                connectionStatus = if (ok) AppStrings.serverConnected(lang) else AppStrings.serverFailed(lang)
                            }
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.NetworkCheck, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            if (isCheckingConnection) AppStrings.testingServer(lang) else AppStrings.testServerBtn(lang),
                            fontSize = 12.sp
                        )
                    }
                }

                if (urlSavedMessage != null) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = urlSavedMessage!!,
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = ForestGreen,
                            fontWeight = FontWeight.SemiBold
                        )
                    )
                }

                if (connectionStatus != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                if (isConnectionOk == true) LightGreenContainer else AlertRedContainer,
                                RoundedCornerShape(8.dp)
                            )
                            .padding(10.dp)
                    ) {
                        Text(
                            text = connectionStatus!!,
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = if (isConnectionOk == true) ForestGreen else AlertRed,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }
                }

                // Offline Reassurance Card
                Spacer(modifier = Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(LightGreenContainer, RoundedCornerShape(8.dp))
                        .padding(10.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.CloudOff,
                            contentDescription = null,
                            tint = ForestGreen,
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            text = AppStrings.offlineBannerHelp(lang),
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = DarkGreenText,
                                fontSize = 12.sp,
                                lineHeight = 17.sp
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = if (lang == "en") "Services Status Breakdown:" else "ফিচারসমূহের অবস্থা:",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold, color = DarkGreenText)
                )
                Spacer(modifier = Modifier.height(4.dp))
                FeatureStatusRow(
                    title = "NASA Weather API (/api/nasa)",
                    isOperational = isConnectionOk == true,
                    statusNote = if (isConnectionOk == true) (if (lang == "en") "Active" else "সচল") else (if (lang == "en") "Offline / Disconnected" else "অফলাইন / সংযোগহীন")
                )
                FeatureStatusRow(
                    title = "Regional Advisory (/api/advisory)",
                    isOperational = isConnectionOk == true,
                    statusNote = if (isConnectionOk == true) (if (lang == "en") "Active" else "সচল") else (if (lang == "en") "Offline / Disconnected" else "অফলাইন / সংযোগহীন")
                )
                FeatureStatusRow(
                    title = "Crop Rotation AEZ Engine",
                    isOperational = true,
                    statusNote = if (lang == "en") "Active (Local Offline Fallback)" else "সচল (অফলাইন মোডসহ)"
                )
                FeatureStatusRow(
                    title = "Cloud Farm Sync (/api/farms)",
                    isOperational = false,
                    statusNote = if (lang == "en") "Not Configured (Local Storage Active)" else "কনফিগার করা হয়নি (মোবাইল মেমোরিতে সক্রিয়)"
                )
            }

            // About AgriShift AI & Space Apps Badge
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "AgriShift AI v1.1",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = ForestGreen
                    )
                )
                Text(
                    text = "NASA Space Apps Challenge 2024 — Field Shift",
                    style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun DashboardToggleItem(
    title: String,
    checked: Boolean,
    onToggle: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle(!checked) }
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = DarkGreenText,
                fontSize = 13.sp
            ),
            modifier = Modifier.weight(1f)
        )
        Switch(
            checked = checked,
            onCheckedChange = onToggle,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = LushGreen
            )
        )
    }
}

@Composable
private fun SourceItem(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall.copy(
                fontWeight = FontWeight.Bold,
                color = DarkGreenText
            )
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodySmall.copy(
                color = SlateGrayText,
                lineHeight = 17.sp
            )
        )
    }
}

@Composable
private fun FeatureStatusRow(
    title: String,
    isOperational: Boolean,
    statusNote: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodySmall.copy(color = DarkGreenText, fontSize = 12.sp)
        )
        Box(
            modifier = Modifier
                .background(
                    if (isOperational) LightGreenContainer else Color(0xFFFFF3E0),
                    RoundedCornerShape(6.dp)
                )
                .padding(horizontal = 6.dp, vertical = 2.dp)
        ) {
            Text(
                text = statusNote,
                style = MaterialTheme.typography.labelSmall.copy(
                    color = if (isOperational) ForestGreen else EarthGold,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
            )
        }
    }
}
