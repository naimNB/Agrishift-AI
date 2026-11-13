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
import com.agrishift.ai.data.model.PlanComparisonItem
import com.agrishift.ai.data.repository.AppPreferencesRepository
import com.agrishift.ai.data.repository.CropPlanningRepository
import com.agrishift.ai.data.repository.RotationUiState
import com.agrishift.ai.ui.components.*
import com.agrishift.ai.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ComparePlansScreen(
    farmProfile: FarmProfile,
    cropPlanningRepository: CropPlanningRepository,
    appPreferencesRepository: AppPreferencesRepository,
    onBack: () -> Unit
) {
    val lang by appPreferencesRepository.language.collectAsState()
    val rotationState by cropPlanningRepository.rotationState.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(farmProfile) {
        if (rotationState is RotationUiState.Idle) {
            cropPlanningRepository.loadRotationPlans(farmProfile)
        }
    }

    Scaffold(
        topBar = {
            AgriTopBar(
                title = AppStrings.compareScreenTitle(lang),
                subtitle = AppStrings.compareScreenSubtitle(lang),
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
            // Explanation Header
            AgriCard(
                backgroundColor = LightGreenContainer.copy(alpha = 0.5f),
                borderColor = LushGreen.copy(alpha = 0.3f)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.CompareArrows,
                        contentDescription = null,
                        tint = ForestGreen,
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = AppStrings.compareIntro(lang),
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = DarkGreenText,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    )
                }
            }

            when (val state = rotationState) {
                is RotationUiState.Loading -> {
                    LoadingView(
                        messageBn = if (lang == "en")
                            "Comparing multi-crop rotations..."
                        else
                            "পরিকল্পনাগুলোর তুলনামূলক বিশ্লেষণ তৈরি করা হচ্ছে..."
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
                    val plans = state.plans
                    val comparisonItems = remember(plans, lang) {
                        cropPlanningRepository.getComparisonItems(plans, lang)
                    }

                    val topFeasible = plans.firstOrNull { it.isFeasible }

                    // Recommendation Summary Banner
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

                    AgriCard(
                        backgroundColor = Color.White,
                        borderColor = EarthGold.copy(alpha = 0.5f)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(EarthGold.copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Star, contentDescription = null, tint = EarthGold, modifier = Modifier.size(20.dp))
                            }
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = AppStrings.bestRecommendationTitle(lang),
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = DarkGreenText,
                                        fontSize = 15.sp
                                    )
                                )
                                Text(
                                    text = if (topFeasible != null) {
                                        "${topFeasible.getTitle(lang)} — ${if (farmProfile.hasIrrigation) AppStrings.bestRecIrrigated(lang) else AppStrings.bestRecRainfed(lang)}"
                                    } else {
                                        if (lang == "en") "Caution: Severe water or soil constraints detected for all evaluated rotations." else "সতর্কতা: বর্তমান সেচ বা মাটির বৈশিষ্ট্যে সব আবর্তনে সীমাবদ্ধতা রয়েছে।"
                                    },
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = ForestGreen,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 13.sp
                                    )
                                )
                            }
                        }
                    }

                    Text(
                        text = if (lang == "en") "Detailed Plan Evaluations:" else "পরিকল্পনাগুলোর বিস্তারিত মূল্যায়ন:",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = DarkGreenText,
                            fontSize = 16.sp
                        )
                    )

                    // Comparison Cards
                    comparisonItems.forEachIndexed { idx, item ->
                        PlanComparisonCard(
                            item = item,
                            planIndex = idx + 1,
                            lang = lang
                        )
                    }
                }

                is RotationUiState.Idle -> {
                    // Waiting
                }
            }

            // Criteria Guidance for Farmers
            AgriCard(
                backgroundColor = Color.White,
                borderColor = SubtleBorder
            ) {
                Text(
                    text = if (lang == "en") "Evaluation Criteria Guide:" else "তুলনার মাপকাঠিগুলোর ব্যাখ্যা:",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText,
                        fontSize = 14.sp
                    )
                )
                Spacer(modifier = Modifier.height(8.dp))

                CriterionRow(
                    icon = Icons.Default.Thermostat,
                    color = EarthGold,
                    name = if (lang == "en") "1. Climate Resilience:" else "১. জলবায়ু সহনশীলতা:",
                    desc = if (lang == "en") "Ability to tolerate heat spells, dry periods, or irregular rain (NASA POWER observations)." else "তাপপ্রবাহ, অসময়ে বৃষ্টি বা খরা সহ্য করার সক্ষমতা (NASA POWER পর্যবেক্ষণ)।"
                )
                Spacer(modifier = Modifier.height(6.dp))
                CriterionRow(
                    icon = Icons.Default.WaterDrop,
                    color = WaterBlue,
                    name = if (lang == "en") "2. Water Savings:" else "২. পানির সামঞ্জস্য ও সাশ্রয়:",
                    desc = if (lang == "en") "Water efficiency and lower groundwater pumping requirements." else "কম সেচে বা বৃষ্টির পানিতে স্বাভাবিক বৃদ্ধি পাওয়ার হার।"
                )
                Spacer(modifier = Modifier.height(6.dp))
                CriterionRow(
                    icon = Icons.Default.Eco,
                    color = LushGreen,
                    name = if (lang == "en") "3. Crop Diversity & Fertility:" else "৩. শস্য বৈচিত্র্য ও উর্বরতা:",
                    desc = if (lang == "en") "Fixing nitrogen and adding biomass to rejuvenate soil nutrients." else "মাটিতে নাইট্রোজেন ও জৈব উপাদান যোগ করার ক্ষমতা।"
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun PlanComparisonCard(
    item: PlanComparisonItem,
    planIndex: Int,
    lang: String
) {
    AgriCard(
        borderColor = if (!item.isFeasible) Color(0xFFFFB74D) else if (item.climateScore >= 90) LushGreen.copy(alpha = 0.5f) else SubtleBorder
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Header: Title & Rating Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${if (lang == "en") "Option" else "পরিকল্পনা"} $planIndex: ${item.getTitle(lang)}",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = if (item.isFeasible) DarkGreenText else Color(0xFFC62828),
                        fontSize = 15.sp
                    ),
                    modifier = Modifier.weight(1f)
                )

                Box(
                    modifier = Modifier
                        .background(
                            if (!item.isFeasible) Color(0xFFC62828) else if (item.climateScore >= 90) LushGreen else ForestGreen,
                            RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = item.overallRating,
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 12.sp
                        )
                    )
                }
            }

            // Highlight Pill
            Box(
                modifier = Modifier
                    .background(
                        if (!item.isFeasible) Color(0xFFFFEBEE) else Color(0xFFF1F8E9),
                        RoundedCornerShape(6.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "${if (!item.isFeasible) (if (lang == "en") "Major Bottleneck" else "প্রধান বাধা") else (if (lang == "en") "Primary Advantage" else "প্রধান সুবিধা")}: ${item.getHighlight(lang)}",
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = if (!item.isFeasible) Color(0xFFC62828) else ForestGreen,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp
                    )
                )
            }

            HorizontalDivider(color = SubtleBorder)

            if (item.isOfflineGuidance) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(LightGreenContainer, RoundedCornerShape(8.dp))
                        .padding(10.dp)
                ) {
                    Text(
                        text = if (lang == "en")
                            "BARC AEZ Regional Pattern: General agro-ecological guidance without live satellite calibration. Consult your local agriculture office."
                        else
                            "বার্ক (BARC) এইজেড আঞ্চলিক রূপরেখা: কোনো লাইভ স্যাটেলাইট উপাত্ত সক্রিয় না থাকায় সাধারণ শস্যবিন্যাস দেখানো হয়েছে। বাস্তবায়নের পূর্বে স্থানীয় কৃষি অফিসে যোগাযোগ করুন।",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = ForestGreen,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                    )
                }
            } else {
                // Progress Bar 1: Climate
                ScoreProgressBar(
                    title = AppStrings.climateResilienceMetric(lang),
                    score = item.climateScore,
                    color = EarthGold
                )

                // Progress Bar 2: Water
                ScoreProgressBar(
                    title = AppStrings.waterSavingsMetric(lang),
                    score = item.waterScore,
                    color = if (item.waterScore < 40) Color(0xFFE53935) else WaterBlue
                )

                // Progress Bar 3: Diversity
                ScoreProgressBar(
                    title = AppStrings.soilDiversityMetric(lang),
                    score = item.diversityScore,
                    color = LushGreen
                )
            }
        }
    }
}

@Composable
private fun ScoreProgressBar(
    title: String,
    score: Int,
    color: Color
) {
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = SlateGrayText,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            )
            Text(
                text = "$score%",
                style = MaterialTheme.typography.bodySmall.copy(
                    color = color,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            )
        }
        LinearProgressIndicator(
            progress = { (score.coerceIn(0, 100)) / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp),
            color = color,
            trackColor = Color(0xFFEEEEEE),
            drawStopIndicator = {}
        )
    }
}

@Composable
private fun CriterionRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    name: String,
    desc: String
) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier
                .size(16.dp)
                .padding(top = 2.dp)
        )
        Column {
            Text(
                text = name,
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = DarkGreenText,
                    fontSize = 12.sp
                )
            )
            Text(
                text = desc,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = SlateGrayText,
                    fontSize = 11.sp
                )
            )
        }
    }
}
