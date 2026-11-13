package com.agrishift.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.FormatListBulleted
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrishift.ai.data.model.AppStrings
import com.agrishift.ai.data.model.FarmProfile
import com.agrishift.ai.data.repository.AppPreferencesRepository
import com.agrishift.ai.data.repository.ClimateRepository
import com.agrishift.ai.data.repository.ClimateUiState
import com.agrishift.ai.data.repository.FarmRepository
import com.agrishift.ai.ui.components.*
import com.agrishift.ai.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ClimateInsightsScreen(
    farmProfile: FarmProfile,
    climateRepository: ClimateRepository,
    appPreferencesRepository: AppPreferencesRepository,
    onBack: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val lang by appPreferencesRepository.language.collectAsState()
    val climateState by climateRepository.climateState.collectAsState()

    var selectedDistrictId by remember { mutableStateOf(farmProfile.districtId) }
    var chartType by remember { mutableStateOf("temp") }

    // Expandable section states ("Details on Demand")
    var showAdvancedCharts by remember { mutableStateOf(false) }
    var showRootZoneExpl by remember { mutableStateOf(false) }
    var showAllAdvisories by remember { mutableStateOf(false) }

    val districts = FarmRepository.DEFAULT_DISTRICTS
    val currentDistrictObj = districts.find { it.id == selectedDistrictId } ?: districts.first()

    LaunchedEffect(selectedDistrictId) {
        climateRepository.loadClimate(selectedDistrictId)
    }

    Scaffold(
        topBar = {
            AgriTopBar(
                title = AppStrings.climateScreenTitle(lang),
                subtitle = AppStrings.climateScreenSubtitle(lang),
                onBack = onBack,
                actions = {
                    IconButton(onClick = {
                        coroutineScope.launch {
                            climateRepository.loadClimate(selectedDistrictId, forceRefresh = true)
                        }
                    }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = ForestGreen
                        )
                    }
                }
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
            // District Selector Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                districts.forEach { dist ->
                    FilterChip(
                        selected = dist.id == selectedDistrictId,
                        onClick = { selectedDistrictId = dist.id },
                        label = { Text(dist.getName(lang), fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = LushGreen,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            // Distinguish Historical Observations from Forecasts
            AgriCard(
                backgroundColor = LightGreenContainer.copy(alpha = 0.5f),
                borderColor = LushGreen.copy(alpha = 0.3f)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Text(
                            text = AppStrings.historicalObservationBadge(lang),
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = ForestGreen,
                                fontSize = 13.sp
                            )
                        )
                        Text(
                            text = AppStrings.forecastDistinctionNote(lang),
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = SlateGrayText,
                                fontSize = 11.sp,
                                lineHeight = 16.sp
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    NasaBadge(text = "NASA POWER")
                }
            }

            // Climate States
            when (val state = climateState) {
                is ClimateUiState.Loading -> {
                    LoadingView(
                        messageBn = if (lang == "en")
                            "Fetching verified agroclimate telemetry from NASA POWER..."
                        else
                            "${currentDistrictObj.nameBn} জেলার জন্য NASA স্যাটেলাইট ও কৃষি উপাত্ত সংগ্রহ করা হচ্ছে..."
                    )
                }

                is ClimateUiState.Error -> {
                    ErrorView(
                        messageBn = state.messageBn,
                        onRetry = {
                            coroutineScope.launch {
                                climateRepository.loadClimate(selectedDistrictId, forceRefresh = true)
                            }
                        }
                    )
                }

                is ClimateUiState.Success -> {
                    val climate = state.climate
                    val summary = climate.summary

                    // 1. Initial View: 4 Essential Climate Metrics (Simple First!)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        val tempVal = summary.avgTemperature?.let { String.format("%.1f", it) } ?: "--"
                        val maxT = summary.maxTemperature?.let { String.format("%.1f", it) } ?: "--"
                        val minT = summary.minTemperature?.let { String.format("%.1f", it) } ?: "--"
                        MetricTile(
                            titleBn = AppStrings.avgTemperature(lang),
                            value = tempVal,
                            unit = "°C",
                            icon = Icons.Default.Thermostat,
                            statusTextBn = AppStrings.tempMaxMinStatus(maxT, minT, lang),
                            accentColor = EarthGold,
                            modifier = Modifier.weight(1f)
                        )

                        val rainVal = summary.totalPrecipitation?.let { String.format("%.1f", it) } ?: "--"
                        val rainStatus = when {
                            (summary.totalPrecipitation ?: 0.0) < 5.0 -> if (lang == "en") "Dry / Low Rain" else "স্বল্প বৃষ্টিপাত (শুষ্ক)"
                            (summary.totalPrecipitation ?: 0.0) < 50.0 -> if (lang == "en") "Moderate Rain" else "পরিমিত বৃষ্টিপাত"
                            else -> if (lang == "en") "Heavy Rainfall" else "ভারী বৃষ্টিপাত"
                        }
                        MetricTile(
                            titleBn = AppStrings.rainfall30Days(lang),
                            value = rainVal,
                            unit = if (lang == "en") "mm" else "মিমি",
                            icon = Icons.Default.WaterDrop,
                            statusTextBn = rainStatus,
                            accentColor = WaterBlue,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        val humVal = summary.avgHumidity?.let { String.format("%.0f", it) } ?: "--"
                        val humStatus = when {
                            (summary.avgHumidity ?: 0.0) >= 70.0 -> if (lang == "en") "Humid / Favorable" else "অনুকূল আর্দ্রতা"
                            (summary.avgHumidity ?: 0.0) >= 50.0 -> if (lang == "en") "Normal" else "স্বাভাবিক"
                            else -> if (lang == "en") "Dry Air" else "শুষ্ক বাতাস"
                        }
                        MetricTile(
                            titleBn = AppStrings.humidityTitle(lang),
                            value = humVal,
                            unit = "%",
                            icon = Icons.Default.Air,
                            statusTextBn = humStatus,
                            accentColor = SoftGreen,
                            modifier = Modifier.weight(1f)
                        )

                        val smRaw = summary.avgSoilMoisture
                        val smVal = smRaw?.let { String.format("%.0f", it * 100) } ?: "--"
                        val smStatus = when {
                            smRaw == null -> if (lang == "en") "No Data" else "উপাত্ত নেই"
                            smRaw < 0.35 -> if (lang == "en") "Dry Soil (Irrigate)" else "মাটি শুষ্ক (সেচ দিন)"
                            smRaw < 0.65 -> if (lang == "en") "Moderate Moisture" else "মাটিতে মধ্যম আর্দ্রতা"
                            else -> if (lang == "en") "Well-Saturated" else "পর্যাপ্ত আর্দ্র মাটি"
                        }
                        MetricTile(
                            titleBn = AppStrings.rootZoneWetnessTitle(lang),
                            value = smVal,
                            unit = "%",
                            icon = Icons.Default.Grass,
                            statusTextBn = smStatus,
                            isNasaModelData = true,
                            accentColor = ForestGreen,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // 2. Expandable Section A: Advanced Charts & Daily Trend (Details on Demand)
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SubtleBorder)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { showAdvancedCharts = !showAdvancedCharts },
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.AutoMirrored.Filled.ShowChart, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(20.dp))
                                    Text(
                                        text = if (showAdvancedCharts) AppStrings.collapseAdvancedCharts(lang) else AppStrings.expandAdvancedCharts(lang),
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            color = DarkGreenText,
                                            fontSize = 14.sp
                                        )
                                    )
                                }
                                Icon(
                                    imageVector = if (showAdvancedCharts) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                    contentDescription = null,
                                    tint = ForestGreen
                                )
                            }

                            if (showAdvancedCharts) {
                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = if (lang == "en") "30-Day Trend Comparison" else "৩০ দিনের দৈনিক গতিপ্রকৃতি",
                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, color = SlateGrayText)
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        FilterChip(
                                            selected = chartType == "temp",
                                            onClick = { chartType = "temp" },
                                            label = { Text(if (lang == "en") "Temperature" else "তাপমাত্রা", fontSize = 11.sp) }
                                        )
                                        FilterChip(
                                            selected = chartType == "rain",
                                            onClick = { chartType = "rain" },
                                            label = { Text(if (lang == "en") "Rainfall" else "বৃষ্টিপাত", fontSize = 11.sp) }
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                SimpleDailyTrendChart(
                                    dailyData = climate.data,
                                    chartType = chartType
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                // Secondary Solar and Wind Speed metrics
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    val solar = summary.avgSolarRadiation?.let { String.format("%.1f", it) } ?: "--"
                                    val wind = summary.avgWindSpeed?.let { String.format("%.1f", it) } ?: "--"
                                    Text(
                                        text = if (lang == "en") "Solar Rad: $solar kWh/m²/day" else "সৌর বিকিরণ: $solar kWh/m²",
                                        style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 12.sp)
                                    )
                                    Text(
                                        text = if (lang == "en") "Wind Speed: $wind m/s" else "বাতাসের গতি: $wind m/s",
                                        style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 12.sp)
                                    )
                                }
                            }
                        }
                    }

                    // 3. Expandable Section B: Root-Zone Moisture Details (Details on Demand)
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SubtleBorder)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { showRootZoneExpl = !showRootZoneExpl },
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.AutoMirrored.Filled.HelpOutline, contentDescription = null, tint = EarthGold, modifier = Modifier.size(20.dp))
                                    Text(
                                        text = if (showRootZoneExpl) AppStrings.collapseRootZoneExplanation(lang) else AppStrings.expandRootZoneExplanation(lang),
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            color = DarkGreenText,
                                            fontSize = 14.sp
                                        )
                                    )
                                }
                                Icon(
                                    imageVector = if (showRootZoneExpl) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                    contentDescription = null,
                                    tint = EarthGold
                                )
                            }

                            if (showRootZoneExpl) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = AppStrings.rootZoneExplanationBody(lang),
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = SlateGrayText,
                                        fontSize = 13.sp,
                                        lineHeight = 18.sp
                                    )
                                )
                            }
                        }
                    }

                    // 4. Expandable Section C: All Field Advisories (Details on Demand)
                    val advisories = state.advisories?.advisories ?: emptyList()
                    if (advisories.isNotEmpty()) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SubtleBorder)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { showAllAdvisories = !showAllAdvisories },
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(Icons.AutoMirrored.Filled.FormatListBulleted, contentDescription = null, tint = LushGreen, modifier = Modifier.size(20.dp))
                                        Text(
                                            text = if (showAllAdvisories) AppStrings.collapseAllAdvisories(lang) else "${AppStrings.expandAllAdvisories(lang)} (${advisories.size})",
                                            style = MaterialTheme.typography.titleMedium.copy(
                                                fontWeight = FontWeight.Bold,
                                                color = DarkGreenText,
                                                fontSize = 14.sp
                                            )
                                        )
                                    }
                                    Icon(
                                        imageVector = if (showAllAdvisories) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = null,
                                        tint = LushGreen
                                    )
                                }

                                if (showAllAdvisories) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    advisories.forEach { adv ->
                                        AgriCard(
                                            modifier = Modifier.padding(vertical = 4.dp),
                                            backgroundColor = if (adv.priority == "urgent") AlertRedContainer.copy(alpha = 0.35f) else Color(0xFFF9FBF9),
                                            borderColor = if (adv.priority == "urgent") AlertRed.copy(alpha = 0.4f) else SubtleBorder
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                Icon(
                                                    imageVector = if (adv.priority == "urgent") Icons.Default.Warning else Icons.Default.CheckCircle,
                                                    contentDescription = null,
                                                    tint = if (adv.priority == "urgent") AlertRed else LushGreen,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                                Text(
                                                    text = adv.getTitle(lang),
                                                    style = MaterialTheme.typography.titleMedium.copy(
                                                        fontWeight = FontWeight.Bold,
                                                        color = DarkGreenText,
                                                        fontSize = 14.sp
                                                    )
                                                )
                                            }
                                            Spacer(modifier = Modifier.height(3.dp))
                                            Text(
                                                text = adv.getMessage(lang),
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    color = SlateGrayText,
                                                    fontSize = 12.sp,
                                                    lineHeight = 17.sp
                                                )
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Source and Attribution
                    AgriCard(backgroundColor = Color(0xFFF9FAF9), borderColor = SubtleBorder) {
                        Text(
                            text = if (lang == "en") "Observation Source & Sensor Integrity:" else "উপাত্তের সত্যতা ও উৎস:",
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = DarkGreenText,
                                fontSize = 12.sp
                            )
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = climate.source,
                            style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 11.sp)
                        )
                        Text(
                            text = "Lat: ${climate.latitude}° N, Lon: ${climate.longitude}° E",
                            style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 11.sp)
                        )
                    }
                }

                is ClimateUiState.Idle -> {
                    LoadingView(messageBn = if (lang == "en") "Connecting to NASA climate feed..." else "জলবায়ু উপাত্তের সংযোগ স্থাপন করা হচ্ছে...")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
