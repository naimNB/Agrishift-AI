package com.agrishift.ai.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val ForestGreen = Color(0xFF1B5E20)
val LushGreen = Color(0xFF2E7D32)
val SoftGreen = Color(0xFF4CAF50)
val LightGreenContainer = Color(0xFFE8F5E9)
val PaleGreenBg = Color(0xFFF6FAF5)
val CardSurface = Color(0xFFFFFFFF)

val EarthGold = Color(0xFFE65100)
val EarthGoldContainer = Color(0xFFFFF3E0)

val WaterBlue = Color(0xFF0277BD)
val WaterBlueContainer = Color(0xFFE1F5FE)

val DarkGreenText = Color(0xFF0F2815)
val SlateGrayText = Color(0xFF455A64)
val SubtleBorder = Color(0xFFC8E6C9)
val AlertRed = Color(0xFFC62828)
val AlertRedContainer = Color(0xFFFFEBEE)

private val LightColorScheme = lightColorScheme(
    primary = LushGreen,
    onPrimary = Color.White,
    primaryContainer = LightGreenContainer,
    onPrimaryContainer = DarkGreenText,
    secondary = EarthGold,
    onSecondary = Color.White,
    secondaryContainer = EarthGoldContainer,
    onSecondaryContainer = Color(0xFF3E2723),
    tertiary = WaterBlue,
    onTertiary = Color.White,
    tertiaryContainer = WaterBlueContainer,
    onTertiaryContainer = Color(0xFF01579B),
    background = PaleGreenBg,
    onBackground = DarkGreenText,
    surface = CardSurface,
    onSurface = DarkGreenText,
    surfaceVariant = Color(0xFFF0F4EF),
    onSurfaceVariant = SlateGrayText,
    outline = SubtleBorder,
    error = AlertRed,
    errorContainer = AlertRedContainer
)

@Composable
fun AgriShiftTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // For farmers in daylight, clear high-contrast light theme is best
    val colorScheme = LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}
