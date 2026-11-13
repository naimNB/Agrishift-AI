package com.agrishift.ai.ui.screens

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.agrishift.ai.data.model.AppStrings
import com.agrishift.ai.data.model.District
import com.agrishift.ai.data.model.FarmProfile
import com.agrishift.ai.data.repository.AppPreferencesRepository
import com.agrishift.ai.data.repository.FarmRepository
import com.agrishift.ai.ui.components.*
import com.agrishift.ai.ui.theme.*

@Composable
fun FarmProfileScreen(
    farmRepository: FarmRepository,
    appPreferencesRepository: AppPreferencesRepository,
    onBack: () -> Unit,
    onSavedSuccessfully: () -> Unit
) {
    val context = LocalContext.current
    val lang by appPreferencesRepository.language.collectAsState()
    val currentProfile by farmRepository.farmProfile.collectAsState()

    val districts = FarmRepository.DEFAULT_DISTRICTS
    val crops = FarmRepository.CROP_OPTIONS
    val soils = FarmRepository.SOIL_OPTIONS
    val seasons = FarmRepository.SEASON_OPTIONS

    var selectedDistrictId by remember { mutableStateOf(currentProfile.districtId) }
    var selectedCrop by remember { mutableStateOf(currentProfile.currentCrop) }
    var selectedSeason by remember { mutableStateOf(currentProfile.season) }
    var selectedSoil by remember { mutableStateOf(currentProfile.soilType) }
    var hasIrrigation by remember { mutableStateOf(currentProfile.hasIrrigation) }
    var areaInput by remember { mutableStateOf(currentProfile.areaBigha) }
    var latitude by remember { mutableStateOf(currentProfile.latitude) }
    var longitude by remember { mutableStateOf(currentProfile.longitude) }

    var isGpsFetching by remember { mutableStateOf(false) }
    var gpsMessage by remember { mutableStateOf<String?>(null) }
    var validationError by remember { mutableStateOf<String?>(null) }
    var showSuccessMessage by remember { mutableStateOf(false) }

    val currentDistrictObj = districts.find { it.id == selectedDistrictId } ?: districts.first()

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (fineGranted || coarseGranted) {
            retrieveGpsLocation(context) { lat, lon ->
                latitude = lat
                longitude = lon
                isGpsFetching = false
                gpsMessage = AppStrings.gpsCapturedDevice(lang)
            }
        } else {
            isGpsFetching = false
            gpsMessage = AppStrings.gpsFallbackDistrict(lang)
        }
    }

    Scaffold(
        topBar = {
            AgriTopBar(
                title = AppStrings.farmScreenTitle(lang),
                subtitle = AppStrings.farmScreenSubtitle(lang),
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
            // Intro Notice
            AgriCard(
                backgroundColor = LightGreenContainer.copy(alpha = 0.5f),
                borderColor = LushGreen.copy(alpha = 0.3f)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = ForestGreen,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = AppStrings.farmScreenNotice(lang),
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = DarkGreenText,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    )
                }
            }

            // District Selection
            AgriDropdownSelector(
                label = AppStrings.selectDistrictLabel(lang),
                selectedValue = currentDistrictObj.getName(lang),
                options = districts.map { it.getName(lang) },
                onSelect = { chosenName ->
                    val found = districts.find { it.getName(lang) == chosenName }
                    if (found != null) {
                        selectedDistrictId = found.id
                        latitude = found.latitude
                        longitude = found.longitude
                        gpsMessage = null
                    }
                },
                helperText = AppStrings.selectDistrictHelper(lang)
            )

            // GPS Coordinates Card
            AgriCard {
                Text(
                    text = AppStrings.gpsCoordinatesTitle(lang),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText,
                        fontSize = 15.sp
                    )
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${AppStrings.latLabel(lang)}: ${String.format("%.4f", latitude)}° N  |  ${AppStrings.lonLabel(lang)}: ${String.format("%.4f", longitude)}° E",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = ForestGreen,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                )

                if (gpsMessage != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = gpsMessage!!,
                        style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 12.sp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedButton(
                    onClick = {
                        isGpsFetching = true
                        gpsMessage = AppStrings.gpsFetching(lang)
                        val hasFine = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.ACCESS_FINE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED
                        val hasCoarse = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED

                        if (hasFine || hasCoarse) {
                            retrieveGpsLocation(context) { lat, lon ->
                                latitude = lat
                                longitude = lon
                                isGpsFetching = false
                                gpsMessage = AppStrings.gpsCapturedDevice(lang)
                            }
                        } else {
                            locationPermissionLauncher.launch(
                                arrayOf(
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION
                                )
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (isGpsFetching) AppStrings.gpsFetching(lang) else AppStrings.getGpsBtn(lang))
                }
            }

            // Crop Selection
            AgriDropdownSelector(
                label = AppStrings.currentCropLabel(lang),
                selectedValue = selectedCrop,
                options = crops,
                onSelect = { selectedCrop = it },
                helperText = AppStrings.currentCropHelper(lang)
            )

            // Season Selection
            AgriDropdownSelector(
                label = AppStrings.seasonChoiceLabel(lang),
                selectedValue = selectedSeason,
                options = seasons,
                onSelect = { selectedSeason = it }
            )

            // Soil Type (Optional)
            AgriDropdownSelector(
                label = AppStrings.soilTypeChoiceLabel(lang),
                selectedValue = selectedSoil,
                options = soils,
                onSelect = { selectedSoil = it },
                helperText = AppStrings.soilTypeHelper(lang)
            )

            // Irrigation Question
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = AppStrings.irrigationQuestion(lang),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText,
                        fontSize = 15.sp
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    IrrigationRadioCard(
                        title = AppStrings.irrigationYesTitle(lang),
                        subtitle = AppStrings.irrigationYesSub(lang),
                        selected = hasIrrigation,
                        onClick = { hasIrrigation = true },
                        modifier = Modifier.weight(1f)
                    )

                    IrrigationRadioCard(
                        title = AppStrings.irrigationNoTitle(lang),
                        subtitle = AppStrings.irrigationNoSub(lang),
                        selected = !hasIrrigation,
                        onClick = { hasIrrigation = false },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Land Area
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = AppStrings.landAreaQuestion(lang),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = DarkGreenText,
                        fontSize = 15.sp
                    )
                )

                val bighaOptions = if (lang == "en") {
                    listOf("1 Bigha", "2 Bighas", "3 Bighas", "5 Bighas", "10 Bighas")
                } else {
                    listOf("১ বিঘা", "২ বিঘা", "৩ বিঘা", "৫ বিঘা", "১০ বিঘা")
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    bighaOptions.forEach { bigha ->
                        FilterChip(
                            selected = areaInput == bigha,
                            onClick = { areaInput = bigha },
                            label = { Text(bigha, fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = LushGreen,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }

            // Validation Message
            if (validationError != null) {
                Text(
                    text = validationError!!,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = AlertRed,
                        fontWeight = FontWeight.Bold
                    )
                )
            }

            // Success feedback
            if (showSuccessMessage) {
                AgriCard(
                    backgroundColor = LightGreenContainer,
                    borderColor = LushGreen
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ForestGreen)
                        Text(
                            text = AppStrings.saveSuccessFeedback(lang),
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = ForestGreen
                            )
                        )
                    }
                }
            }

            // Save Button
            AgriButton(
                text = AppStrings.saveFarmDetailsBtn(lang),
                onClick = {
                    if (selectedDistrictId.isBlank()) {
                        validationError = AppStrings.validationDistrict(lang)
                        return@AgriButton
                    }
                    if (selectedCrop.isBlank()) {
                        validationError = AppStrings.validationCrop(lang)
                        return@AgriButton
                    }

                    validationError = null
                    val distNameBn = districts.find { it.id == selectedDistrictId }?.nameBn ?: "বগুড়া"

                    val updated = FarmProfile(
                        districtId = selectedDistrictId,
                        districtNameBn = distNameBn,
                        latitude = latitude,
                        longitude = longitude,
                        currentCrop = selectedCrop,
                        season = selectedSeason,
                        soilType = selectedSoil,
                        hasIrrigation = hasIrrigation,
                        areaBigha = areaInput.ifBlank { if (lang == "en") "3 Bighas" else "৩ বিঘা" },
                        lastUpdated = System.currentTimeMillis()
                    )

                    farmRepository.saveFarmProfile(updated)
                    showSuccessMessage = true
                    onSavedSuccessfully()
                },
                icon = Icons.Default.Save
            )

            // Local Storage Note
            AgriCard(
                backgroundColor = Color.White,
                borderColor = SubtleBorder
            ) {
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CloudDone,
                        contentDescription = null,
                        tint = LushGreen,
                        modifier = Modifier.size(20.dp)
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = AppStrings.deviceStorageNoticeTitle(lang),
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = DarkGreenText
                            )
                        )
                        Text(
                            text = AppStrings.deviceStorageNoticeBody(lang),
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = SlateGrayText,
                                fontSize = 12.sp
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun IrrigationRadioCard(
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(
                if (selected) LightGreenContainer else Color.White,
                RoundedCornerShape(12.dp)
            )
            .border(
                1.5.dp,
                if (selected) LushGreen else SubtleBorder,
                RoundedCornerShape(12.dp)
            )
            .clickable(onClick = onClick)
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = if (selected) ForestGreen else DarkGreenText,
                        fontSize = 14.sp
                    )
                )
                RadioButton(
                    selected = selected,
                    onClick = onClick,
                    colors = RadioButtonDefaults.colors(selectedColor = LushGreen)
                )
            }
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = SlateGrayText,
                    fontSize = 11.sp
                )
            )
        }
    }
}

@SuppressLint("MissingPermission")
private fun retrieveGpsLocation(context: Context, onLocationResult: (Double, Double) -> Unit) {
    try {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        if (locationManager != null) {
            val gpsLoc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            val netLoc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            val bestLoc = gpsLoc ?: netLoc
            if (bestLoc != null) {
                onLocationResult(bestLoc.latitude, bestLoc.longitude)
                return
            }
        }
    } catch (_: Exception) {
    }
    onLocationResult(24.8465, 89.3773)
}
