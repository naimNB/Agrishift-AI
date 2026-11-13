package com.agrishift.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.agrishift.ai.data.repository.AppPreferencesRepository
import com.agrishift.ai.data.repository.ClimateRepository
import com.agrishift.ai.data.repository.CropPlanningRepository
import com.agrishift.ai.data.repository.FarmRepository
import com.agrishift.ai.ui.navigation.AgriShiftApp
import com.agrishift.ai.ui.theme.AgriShiftTheme

class MainActivity : ComponentActivity() {

    private lateinit var farmRepository: FarmRepository
    private lateinit var climateRepository: ClimateRepository
    private lateinit var cropPlanningRepository: CropPlanningRepository
    private lateinit var appPreferencesRepository: AppPreferencesRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        farmRepository = FarmRepository(applicationContext)
        climateRepository = ClimateRepository()
        cropPlanningRepository = CropPlanningRepository()
        appPreferencesRepository = AppPreferencesRepository(applicationContext)

        setContent {
            AgriShiftTheme {
                AgriShiftApp(
                    farmRepository = farmRepository,
                    climateRepository = climateRepository,
                    cropPlanningRepository = cropPlanningRepository,
                    appPreferencesRepository = appPreferencesRepository
                )
            }
        }
    }
}
