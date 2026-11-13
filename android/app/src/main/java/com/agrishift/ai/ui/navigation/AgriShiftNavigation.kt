package com.agrishift.ai.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.CompareArrows
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.agrishift.ai.data.model.AppStrings
import com.agrishift.ai.data.repository.AppPreferencesRepository
import com.agrishift.ai.data.repository.ClimateRepository
import com.agrishift.ai.data.repository.CropPlanningRepository
import com.agrishift.ai.data.repository.FarmRepository
import com.agrishift.ai.ui.screens.*
import com.agrishift.ai.ui.theme.*

sealed class Screen(val route: String, val icon: ImageVector) {
    object Home : Screen("home", Icons.Default.Home)
    object Farm : Screen("farm", Icons.Default.Agriculture)
    object Climate : Screen("climate", Icons.Default.Cloud)
    object Rotations : Screen("rotations", Icons.Default.Autorenew)
    object Compare : Screen("compare", Icons.AutoMirrored.Filled.CompareArrows)
    object Settings : Screen("settings", Icons.Default.Settings)

    fun getLabel(lang: String): String = when (this) {
        Home -> AppStrings.navHome(lang)
        Farm -> AppStrings.navFarm(lang)
        Climate -> AppStrings.navClimate(lang)
        Rotations -> AppStrings.navRotations(lang)
        Compare -> AppStrings.navCompare(lang)
        Settings -> AppStrings.navSettings(lang)
    }
}

val BOTTOM_NAV_ITEMS = listOf(
    Screen.Home,
    Screen.Farm,
    Screen.Climate,
    Screen.Rotations,
    Screen.Settings
)

@Composable
fun AgriShiftApp(
    farmRepository: FarmRepository,
    climateRepository: ClimateRepository,
    cropPlanningRepository: CropPlanningRepository,
    appPreferencesRepository: AppPreferencesRepository
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route

    val lang by appPreferencesRepository.language.collectAsState()
    val farmProfile by farmRepository.farmProfile.collectAsState()

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 6.dp
            ) {
                BOTTOM_NAV_ITEMS.forEach { item ->
                    val selected = currentRoute == item.route
                    val itemLabel = item.getLabel(lang)
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            if (currentRoute != item.route) {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = itemLabel,
                                tint = if (selected) ForestGreen else SlateGrayText
                            )
                        },
                        label = {
                            Text(
                                text = itemLabel,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 11.sp,
                                    color = if (selected) ForestGreen else SlateGrayText
                                )
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = LightGreenContainer
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    farmProfile = farmProfile,
                    climateRepository = climateRepository,
                    appPreferencesRepository = appPreferencesRepository,
                    onNavigateToFarm = { navController.navigate(Screen.Farm.route) },
                    onNavigateToClimate = { navController.navigate(Screen.Climate.route) },
                    onNavigateToRotations = { navController.navigate(Screen.Rotations.route) },
                    onNavigateToCompare = { navController.navigate(Screen.Compare.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }

            composable(Screen.Farm.route) {
                FarmProfileScreen(
                    farmRepository = farmRepository,
                    appPreferencesRepository = appPreferencesRepository,
                    onBack = { navController.popBackStack() },
                    onSavedSuccessfully = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Climate.route) {
                ClimateInsightsScreen(
                    farmProfile = farmProfile,
                    climateRepository = climateRepository,
                    appPreferencesRepository = appPreferencesRepository,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Rotations.route) {
                CropRotationPlannerScreen(
                    farmProfile = farmProfile,
                    cropPlanningRepository = cropPlanningRepository,
                    appPreferencesRepository = appPreferencesRepository,
                    onBack = { navController.popBackStack() },
                    onNavigateToCompare = { navController.navigate(Screen.Compare.route) }
                )
            }

            composable(Screen.Compare.route) {
                ComparePlansScreen(
                    farmProfile = farmProfile,
                    cropPlanningRepository = cropPlanningRepository,
                    appPreferencesRepository = appPreferencesRepository,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    appPreferencesRepository = appPreferencesRepository,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
