package com.agrishift.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.CompareArrows
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
import com.agrishift.ai.data.model.CropRotationPlan
import com.agrishift.ai.data.model.FarmProfile
import com.agrishift.ai.data.repository.AppPreferencesRepository
import com.agrishift.ai.data.repository.CropPlanningRepository
import com.agrishift.ai.data.repository.RotationUiState
import com.agrishift.ai.ui.components.*
import com.agrishift.ai.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun CropRotationPlannerScreen(
    farmProfile: FarmProfile,
    cropPlanningRepository: CropPlanningRepository,
    appPreferencesRepository: AppPreferencesRepository,
    onBack: () -> Unit,
    onNavigateToCompare: () -> Unit
) {
    val lang by appPreferencesRepository.language.collectAsState()
    val rotationState by cropPlanningRepository.rotationState.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(farmProfile) {
        cropPlanningRepository.loadRotationPlans(farmProfile)
    }

    var showAllPlans by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            AgriTopBar(
                title = AppStrings.rotationScreenTitle(lang),
                subtitle = AppStrings.rotationScreenSubtitle(lang),
                onBack = onBack,
                actions = {
                    IconButton(onClick = {
                        coroutineScope.launch {
                            cropPlanningRepository.loadRotationPlans(farmProfile, forceRefresh = true)
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
            // Current Farm Status Banner
            AgriCard(
                backgroundColor = LightGreenContainer.copy(alpha = 0.6f),
                borderColor = LushGreen.copy(alpha = 0.3f)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = AppStrings.currentStandingCrop(lang),
                            style = MaterialTheme.typography.labelMedium.copy(color = SlateGrayText)
                        )
                        Text(
                            text = "${farmProfile.currentCrop}  |  ${farmProfile.season}",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = DarkGreenText,
                                fontSize = 15.sp
                            )
                        )
                        val distDisplay = if (lang == "en") farmProfile.districtId.replaceFirstChar { it.uppercase() } else farmProfile.districtNameBn
                        val irrigationStatus = if (farmProfile.hasIrrigation) AppStrings.irrigatedText(lang) else AppStrings.rainfedText(lang)
                        Text(
                            text = "$distDisplay • $irrigationStatus • ${farmProfile.soilType}",
                            style = MaterialTheme.typography.bodySmall.copy(color = ForestGreen, fontWeight = FontWeight.SemiBold)
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .background(LushGreen.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Eco,
                            contentDescription = null,
                            tint = ForestGreen,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }

            // Agronomic Introduction Card
            AgriCard {
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Lightbulb,
                        contentDescription = null,
                        tint = EarthGold,
                        modifier = Modifier.size(20.dp)
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(
                            text = AppStrings.rotationRationaleTitle(lang),
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = DarkGreenText,
                                fontSize = 14.sp
                            )
                        )
                        Text(
                            text = AppStrings.rotationRationaleBody(lang),
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = SlateGrayText,
                                fontSize = 13.sp,
                                lineHeight = 18.sp
                            )
                        )
                    }
                }
            }

            // Honest Limitation & Agronomic Basis Disclaimer
            AgriCard(
                backgroundColor = Color(0xFFFFFDE7),
                borderColor = Color(0xFFFBC02D).copy(alpha = 0.5f)
            ) {
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Color(0xFFF57F17),
                        modifier = Modifier.size(20.dp)
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(
                            text = AppStrings.recommendationDisclaimerTitle(lang),
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFE65100),
                                fontSize = 13.sp
                            )
                        )
                        Text(
                            text = AppStrings.recommendationDisclaimerBody(lang),
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = DarkGreenText,
                                fontSize = 12.sp,
                                lineHeight = 17.sp
                            )
                        )
                    }
                }
            }

            // State Handling
            when (val state = rotationState) {
                is RotationUiState.Loading -> {
                    LoadingView(
                        messageBn = if (lang == "en")
                            "Evaluating BARC Agro-Ecological Zones & NASA POWER observations..."
                        else
                            "কৃষি গবেষণা কাউন্সিল (BARC) ও NASA উপাত্তের ভিত্তিতে উপযুক্ত শস্য আবর্তন তৈরি করা হচ্ছে..."
                    )
                }

                is RotationUiState.Error -> {
                    ErrorView(
                        messageBn = if (lang == "en") state.messageEn else state.messageBn,
                        onRetry = {
                            coroutineScope.launch {
                                cropPlanningRepository.loadRotationPlans(farmProfile, forceRefresh = true)
                            }
                        }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedButton(
                        onClick = { cropPlanningRepository.switchToOfflineMode(farmProfile) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.CloudOff, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = AppStrings.switchToOfflineBtn(lang),
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                }

                is RotationUiState.Success -> {
                    if (state.isOffline) {
                        AgriCard(
                            backgroundColor = Color(0xFFFFF3E0),
                            borderColor = Color(0xFFFFB74D)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(Icons.Default.CloudOff, contentDescription = null, tint = Color(0xFFE65100))
                                Column {
                                    Text(
                                        text = AppStrings.offlineNoticeTitle(lang),
                                        style = MaterialTheme.typography.titleSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFFE65100)
                                        )
                                    )
                                    Text(
                                        text = AppStrings.offlineNoticeBody(lang),
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            color = DarkGreenText,
                                            fontSize = 12.sp
                                        )
                                    )
                                }
                            }
                        }
                    }

                    Text(
                        text = AppStrings.recommendedPlansHeading(lang),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 16.sp
                        )
                    )

                    val allPlans = state.plans
                    val displayedPlans = if (showAllPlans) allPlans else allPlans.take(2)

                    // Displayed Plans
                    displayedPlans.forEachIndexed { index, plan ->
                        RotationPlanCard(
                            plan = plan,
                            index = index + 1,
                            lang = lang
                        )
                    }

                    // "Show More / Show Less" Action if more than 2 plans
                    if (allPlans.size > 2) {
                        OutlinedButton(
                            onClick = { showAllPlans = !showAllPlans },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(
                                imageVector = if (showAllPlans) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (showAllPlans)
                                    AppStrings.showLessPlansBtn(lang)
                                else
                                    if (lang == "en") "Show All ${allPlans.size} Plans ▼" else "সবগুলো (${allPlans.size}টি) পরিকল্পনা দেখুন ▼",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                        }
                    }

                    // Direct Action to Compare Plans
                    AgriButton(
                        text = AppStrings.compareRotationsAction(lang),
                        onClick = onNavigateToCompare,
                        icon = Icons.AutoMirrored.Filled.CompareArrows,
                        containerColor = EarthGold
                    )

                    // Data Sources and Attribution
                    if (state.dataSources.isNotEmpty()) {
                        AgriCard(
                            backgroundColor = Color.White,
                            borderColor = SubtleBorder
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = if (lang == "en") "Decision Engine Data Lineage:" else "তথ্য ও বৈজ্ঞানিক উপাত্তের উৎস:",
                                    style = MaterialTheme.typography.labelLarge.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = DarkGreenText,
                                        fontSize = 12.sp
                                    )
                                )
                                Text(
                                    text = "• ${if (lang == "en") "Telemetry Source" else "উপাত্তের উৎস"}: ${state.telemetrySource}",
                                    style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 11.sp)
                                )
                                state.dataSources.forEach { src ->
                                    Text(
                                        text = "• $src",
                                        style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 11.sp)
                                    )
                                }
                            }
                        }
                    }
                }

                is RotationUiState.Idle -> {
                    // Waiting to load
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun RotationPlanCard(
    plan: CropRotationPlan,
    index: Int,
    lang: String
) {
    AgriCard(
        borderColor = if (plan.isFeasible) SubtleBorder else Color(0xFFFFB74D)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Plan Title & Feasibility Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${if (lang == "en") "Option" else "পরিকল্পনা"} $index: ${plan.getTitle(lang)}",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = if (plan.isFeasible) ForestGreen else Color(0xFFC62828),
                        fontSize = 15.sp
                    ),
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Box(
                    modifier = Modifier
                        .background(
                            if (plan.isFeasible) LushGreen.copy(alpha = 0.15f) else Color(0xFFFFEBEE),
                            RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (plan.isFeasible) AppStrings.feasibleBadge(lang) else AppStrings.infeasibleBadge(lang),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (plan.isFeasible) ForestGreen else Color(0xFFC62828),
                            fontSize = 11.sp
                        )
                    )
                }
            }

            // Sequence Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(LightGreenContainer, RoundedCornerShape(10.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(
                    text = plan.getSequence(lang),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText,
                        fontSize = 13.sp
                    )
                )
            }

            // Constraints Alert Box (when constraints exist)
            if (plan.constraints.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFFFF3E0), RoundedCornerShape(8.dp))
                        .padding(10.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFE65100), modifier = Modifier.size(16.dp))
                            Text(
                                text = AppStrings.constraintsHeading(lang),
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFE65100),
                                    fontSize = 12.sp
                                )
                            )
                        }
                        plan.constraints.forEach { c ->
                            Text(
                                text = "• $c",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Color(0xFF4E342E),
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp
                                )
                            )
                        }
                    }
                }
            }

            // Metric Badges
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (plan.isOfflineGuidance) {
                    MetricBadge(
                        label = if (lang == "en") "Guidance Type" else "পরামর্শের ধরন",
                        value = if (lang == "en") "Regional" else "আঞ্চলিক",
                        color = ForestGreen,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBadge(
                        label = if (lang == "en") "Water Status" else "সেচ সামঞ্জস্য",
                        value = if (!plan.isFeasible) (if (lang == "en") "Deficit" else "ঘাটতি") else (if (lang == "en") "Compatible" else "অনুকূল"),
                        color = if (!plan.isFeasible) Color(0xFFE53935) else WaterBlue,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBadge(
                        label = if (lang == "en") "Crop Cycle" else "শস্য বিন্যাস",
                        value = if (lang == "en") "3-Crop" else "৩-ফসলি",
                        color = EarthGold,
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    MetricBadge(
                        label = if (lang == "en") "Suitability" else "জলবায়ু উপযোগী",
                        value = "${plan.climateSuitabilityPercent}%",
                        color = LushGreen,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBadge(
                        label = if (lang == "en") "Water Savings" else "পানির সামঞ্জস্য",
                        value = "${plan.waterCompatibilityPercent}%",
                        color = if (plan.waterCompatibilityPercent < 40) Color(0xFFE53935) else WaterBlue,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBadge(
                        label = if (lang == "en") "Diversity" else "শস্য বৈচিত্র্য",
                        value = "${plan.diversityScorePercent}%",
                        color = EarthGold,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            HorizontalDivider(color = SubtleBorder)

            // Why Suitable Explanation
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = LushGreen, modifier = Modifier.size(16.dp))
                    Text(
                        text = AppStrings.whySuitableHeading(lang),
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 13.sp
                        )
                    )
                }
                Text(
                    text = plan.getWhySuitable(lang),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = SlateGrayText,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                )
            }

            // Soil Health Benefits
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.Grass, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(16.dp))
                    Text(
                        text = AppStrings.soilBenefitHeading(lang),
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 13.sp
                        )
                    )
                }
                Text(
                    text = plan.getSoilBenefit(lang),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = SlateGrayText,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                )
            }

            // Scientific Basis & Risk Info
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF9FAF9), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "${AppStrings.riskHeading(lang)} ${plan.getRiskLevel(lang)}",
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = SlateGrayText,
                        fontSize = 12.sp
                    )
                )
                if (plan.scientificBasis.isNotBlank()) {
                    Text(
                        text = "${AppStrings.scientificBasisHeading(lang)} ${plan.scientificBasis}",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = ForestGreen,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    )
                }
            }
        }
    }
}

@Composable
private fun MetricBadge(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
            .padding(vertical = 6.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = color,
                    fontSize = 14.sp
                )
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(
                    color = SlateGrayText,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            )
        }
    }
}
