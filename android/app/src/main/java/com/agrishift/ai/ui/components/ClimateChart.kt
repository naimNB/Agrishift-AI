package com.agrishift.ai.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrishift.ai.data.model.NasaClimateDaily
import com.agrishift.ai.ui.theme.*

@Composable
fun SimpleDailyTrendChart(
    dailyData: List<NasaClimateDaily>,
    chartType: String = "temp", // "temp" or "rain"
    modifier: Modifier = Modifier
) {
    if (dailyData.isEmpty()) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .height(140.dp)
                .background(Color(0xFFF5F7F5), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "উপাত্ত প্রস্তুত হচ্ছে...",
                style = MaterialTheme.typography.bodyMedium.copy(color = SlateGrayText)
            )
        }
        return
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (chartType == "temp") "গত ৩০ দিনের তাপমাত্রার গতিপ্রকৃতি (°C)" else "গত ৩০ দিনের দৈনিক বৃষ্টিপাত (মিমি)",
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = DarkGreenText,
                    fontSize = 13.sp
                )
            )
            Text(
                text = "দৈনিক নাসা রেকর্ড",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = SlateGrayText,
                    fontSize = 11.sp
                )
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        val points = if (chartType == "temp") {
            dailyData.mapNotNull { it.tempAvg ?: it.tempMax }
        } else {
            dailyData.mapNotNull { it.precipitation }
        }

        val maxVal = (points.maxOrNull() ?: 35.0).coerceAtLeast(if (chartType == "temp") 30.0 else 10.0)
        val minVal = if (chartType == "temp") {
            (points.minOrNull() ?: 15.0).coerceAtMost(20.0)
        } else 0.0

        val range = (maxVal - minVal).coerceAtLeast(1.0)
        val primaryColor = if (chartType == "temp") EarthGold else WaterBlue

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val width = size.width
                val height = size.height
                val stepX = width / (points.size.coerceAtLeast(2) - 1)

                // Draw horizontal guide lines
                val lineCount = 3
                for (i in 0..lineCount) {
                    val y = height * (i / lineCount.toFloat())
                    drawLine(
                        color = Color(0xFFEEEEEE),
                        start = Offset(0f, y),
                        end = Offset(width, y),
                        strokeWidth = 1.dp.toPx()
                    )
                }

                if (chartType == "rain") {
                    // Draw Bar Chart for precipitation
                    val barWidth = (width / points.size.coerceAtLeast(1)) * 0.7f
                    points.forEachIndexed { index, value ->
                        val barHeight = ((value - minVal) / range).toFloat() * (height - 10.dp.toPx())
                        val x = index * (width / points.size) + (width / points.size - barWidth) / 2
                        val y = height - barHeight
                        drawRect(
                            color = primaryColor.copy(alpha = if (value > 5.0) 0.9f else 0.5f),
                            topLeft = Offset(x, y),
                            size = Size(barWidth, barHeight)
                        )
                    }
                } else {
                    // Draw Line Trend for temperature
                    val path = Path()
                    points.forEachIndexed { index, value ->
                        val normalized = ((value - minVal) / range).toFloat()
                        val x = index * stepX
                        val y = height - (normalized * (height - 16.dp.toPx())) - 8.dp.toPx()

                        if (index == 0) {
                            path.moveTo(x, y)
                        } else {
                            path.lineTo(x, y)
                        }

                        // Draw small point
                        drawCircle(
                            color = primaryColor,
                            radius = 2.5.dp.toPx(),
                            center = Offset(x, y)
                        )
                    }

                    drawPath(
                        path = path,
                        color = primaryColor,
                        style = Stroke(width = 2.5.dp.toPx())
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            val startDay = dailyData.firstOrNull()?.date ?: "শুরু"
            val endDay = dailyData.lastOrNull()?.date ?: "বর্তমান"
            Text(
                text = "তারিখ: $startDay",
                style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 11.sp)
            )
            Text(
                text = "সর্বোচ্চ: ${String.format("%.1f", maxVal)} ${if (chartType == "temp") "°C" else "মিমি"}",
                style = MaterialTheme.typography.bodySmall.copy(
                    color = primaryColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
            )
            Text(
                text = "সর্বশেষ: $endDay",
                style = MaterialTheme.typography.bodySmall.copy(color = SlateGrayText, fontSize = 11.sp)
            )
        }
    }
}
