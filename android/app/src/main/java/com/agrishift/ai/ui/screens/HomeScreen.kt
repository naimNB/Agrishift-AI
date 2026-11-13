package com.agrishift.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrishift.ai.data.model.AppStrings
import com.agrishift.ai.data.model.FarmProfile
import com.agrishift.ai.data.repository.AppPreferencesRepository
import com.agrishift.ai.data.repository.ClimateRepository
import com.agrishift.ai.data.repository.ClimateUiState
import com.agrishift.ai.ui.components.*
import com.agrishift.ai.ui.theme.*

@Composable
fun HomeScreen(
    farmProfile: FarmProfile,
    climateRepository: ClimateRepository,
    appPreferencesRepository: AppPreferencesRepository,
    onNavigateToFarm: () -> Unit,
    onNavigateToClimate: () -> Unit,
    onNavigateToRotations: () -> Unit,
    onNavigateToCompare: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val lang by appPreferencesRepository.language.collectAsState()
    val showRotations by appPreferencesRepository.showRotationShortcut.collectAsState()
    val showClimate by appPreferencesRepository.showClimateShortcut.collectAsState()
    val showCompare by appPreferencesRepository.showCompareShortcut.collectAsState()
    val showAdvisory by appPreferencesRepository.showAdvisoryShortcut.collectAsState()

    val climateState by climateRepository.climateState.collectAsState()

    var showCustomizeDialog by remember { mutableStateOf(false) }

    LaunchedEffect(farmProfile.districtId) {
        climateRepository.loadClimate(farmProfile.districtId)
    }

    Scaffold(
        topBar = {
            AgriTopBar(
                title = AppStrings.appName(lang),
                subtitle = AppStrings.appSlogan(lang),
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = AppStrings.navSettings(lang),
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
            // 1. Welcome Card (Simple First)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = LushGreen),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.WbSunny,
                            contentDescription = null,
                            tint = Color(0xFFFFD54F),
                            modifier = Modifier.size(22.dp)
                        )
                        Text(
                            text = AppStrings.welcomeFarmer(lang),
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 20.sp
                            )
                        )
                    }
                    Text(
                        text = AppStrings.homeHeroDesc(lang),
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Color.White.copy(alpha = 0.95f),
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    )
                }
            }

            // 2. Active Farm Summary Card
            AgriCard(borderColor = LushGreen.copy(alpha = 0.35f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = AppStrings.activeFarmSummary(lang),
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = DarkGreenText,
                                fontSize = 15.sp
                            )
                        )
                        val distDisplay = if (lang == "en") farmProfile.districtId.replaceFirstChar { it.uppercase() } else farmProfile.districtNameBn
                        Text(
                            text = "$distDisplay • ${farmProfile.currentCrop}",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = ForestGreen,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                        )
                    }

                    OutlinedButton(
                        onClick = onNavigateToFarm,
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(AppStrings.editBtn(lang), fontSize = 13.sp)
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), color = SubtleBorder)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    FarmSnippet(label = AppStrings.seasonLabel(lang), value = farmProfile.season.take(12))
                    FarmSnippet(label = AppStrings.soilLabel(lang), value = farmProfile.soilType.take(8))
                    FarmSnippet(
                        label = AppStrings.irrigationLabel(lang),
                        value = if (farmProfile.hasIrrigation) AppStrings.irrigatedText(lang) else AppStrings.rainfedText(lang)
                    )
                    FarmSnippet(label = AppStrings.areaLabel(lang), value = farmProfile.areaBigha)
                }
            }

            // 3. Primary Action Button
            AgriButton(
                text = AppStrings.primaryActionAddFarm(lang),
                onClick = onNavigateToFarm,
                icon = Icons.Default.Agriculture
            )

            // 4. One Concise, Actionable Priority Advisory (When Available)
            if (showAdvisory) {
                when (val state = climateState) {
                    is ClimateUiState.Success -> {
                        val firstAdv = state.advisories?.advisories?.firstOrNull()
                        if (firstAdv != null) {
                            AgriCard(
                                backgroundColor = LightGreenContainer.copy(alpha = 0.6f),
                                borderColor = LushGreen.copy(alpha = 0.4f)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.NotificationsActive,
                                        contentDescription = null,
                                        tint = ForestGreen,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = "${AppStrings.regionalAdvisoryTitle(lang)} (${state.climate.displayName})",
                                        style = MaterialTheme.typography.labelLarge.copy(
                                            fontWeight = FontWeight.Bold,
                                            color = ForestGreen,
                                            fontSize = 13.sp
                                        )
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = firstAdv.getTitle(lang),
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = DarkGreenText,
                                        fontSize = 15.sp
                                    )
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = firstAdv.getMessage(lang),
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        color = SlateGrayText,
                                        fontSize = 13.sp,
                                        lineHeight = 18.sp
                                    )
                                )
                            }
                        }
                    }
                    is ClimateUiState.Loading -> {
                        Text(
                            text = AppStrings.checkingAdvisory(lang),
                            style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText)
                        )
                    }
                    else -> { /* idle/error */ }
                }
            }

            // 5. Four Clear Primary Shortcuts (Filtered by Dashboard Customization)
            Text(
                text = AppStrings.fourShortcutsTitle(lang),
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = DarkGreenText,
                    fontSize = 16.sp
                )
            )

            if (showRotations) {
                PrimaryShortcutCard(
                    title = AppStrings.shortcutRotationsTitle(lang),
                    subtitle = AppStrings.shortcutRotationsDesc(lang),
                    icon = Icons.Default.Autorenew,
                    iconColor = LushGreen,
                    onClick = onNavigateToRotations
                )
            }

            if (showClimate) {
                PrimaryShortcutCard(
                    title = AppStrings.shortcutClimateTitle(lang),
                    subtitle = AppStrings.shortcutClimateDesc(lang),
                    icon = Icons.Default.Cloud,
                    iconColor = WaterBlue,
                    onClick = onNavigateToClimate
                )
            }

            if (showCompare) {
                PrimaryShortcutCard(
                    title = AppStrings.shortcutCompareTitle(lang),
                    subtitle = AppStrings.shortcutCompareDesc(lang),
                    icon = Icons.AutoMirrored.Filled.CompareArrows,
                    iconColor = EarthGold,
                    onClick = onNavigateToCompare
                )
            }

            // 6. Secondary Section (Details on Demand)
            AgriCard(
                backgroundColor = Color.White,
                borderColor = SubtleBorder
            ) {
                Text(
                    text = AppStrings.secondarySectionTitle(lang),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText,
                        fontSize = 14.sp
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { showCustomizeDialog = true },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.DashboardCustomize, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(AppStrings.customizeDashboardBtn(lang), fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = onNavigateToSettings,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Tune, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(AppStrings.navSettings(lang), fontSize = 12.sp)
                    }
                }
            }

            // Attribution Footer
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                NasaBadge()
                Text(
                    text = AppStrings.spaceAppsFooter(lang),
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = SlateGrayText,
                        fontSize = 11.sp
                    )
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
        }

        // Dashboard Customization Dialog
        if (showCustomizeDialog) {
            AlertDialog(
                onDismissRequest = { showCustomizeDialog = false },
                title = {
                    Text(
                        text = AppStrings.dashboardCustomizationTitle(lang),
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText
                    )
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = AppStrings.dashboardCustomizationDesc(lang),
                            style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText)
                        )

                        CustomizationToggleRow(
                            label = AppStrings.toggleRotationsShortcut(lang),
                            checked = showRotations,
                            onCheckedChange = { appPreferencesRepository.setShowRotationShortcut(it) }
                        )

                        CustomizationToggleRow(
                            label = AppStrings.toggleClimateShortcut(lang),
                            checked = showClimate,
                            onCheckedChange = { appPreferencesRepository.setShowClimateShortcut(it) }
                        )

                        CustomizationToggleRow(
                            label = AppStrings.toggleCompareShortcut(lang),
                            checked = showCompare,
                            onCheckedChange = { appPreferencesRepository.setShowCompareShortcut(it) }
                        )

                        CustomizationToggleRow(
                            label = AppStrings.toggleAdvisoryBanner(lang),
                            checked = showAdvisory,
                            onCheckedChange = { appPreferencesRepository.setShowAdvisoryShortcut(it) }
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = { showCustomizeDialog = false },
                        colors = ButtonDefaults.buttonColors(containerColor = LushGreen)
                    ) {
                        Text("ঠিক আছে / OK", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    }
}

@Composable
private fun CustomizationToggleRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium.copy(color = DarkGreenText, fontSize = 13.sp),
            modifier = Modifier.weight(1f)
        )
        Checkbox(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = CheckboxDefaults.colors(checkedColor = LushGreen)
        )
    }
}

@Composable
private fun FarmSnippet(label: String, value: String) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(color = SlateGrayText, fontSize = 11.sp)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = FontWeight.Bold,
                color = DarkGreenText,
                fontSize = 13.sp
            )
        )
    }
}

@Composable
private fun PrimaryShortcutCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(iconColor.copy(alpha = 0.12f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(24.dp)
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText,
                        fontSize = 15.sp
                    )
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = SlateGrayText,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                )
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = SlateGrayText.copy(alpha = 0.6f)
            )
        }
    }
}
