/**
 * predictionService.js
 * Real ML API: POST /api/predictions/crop-suitability
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * ML model দিয়ে crop suitability predict করে।
 * @param {Object} params
 * @param {string} params.district   - North Bengal district name
 * @param {string} params.crop       - "rice" | "wheat" | "maize" | "jute"
 * @param {number} params.temp_avg
 * @param {number} params.precipitation
 * @param {number} params.humidity
 * @param {number} params.soil_moisture
 * @param {number} [params.solar_rad]
 */
export async function predictCropSuitability(params) {
  const res = await fetch(`${API_BASE}/api/predictions/crop-suitability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Prediction failed (${res.status})`);
  }

  return res.json();
  // Returns: { crop, district, suitability, confidence, recommendation, best_sow_month, model_used }
}

/**
 * Legacy wrapper — পুরানো components এর সাথে compatibility রাখতে।
 * CropRecommendation.jsx এ soilType + season দিয়ে call করা হয়।
 * Climate data NASA থেকে আসে, এখন dummy values দিয়ে bridge করা হচ্ছে।
 */
export async function predictCrops({ soilType = "loam", season = "rabi", district = "bogura" } = {}) {
  const normDistrict = district.toLowerCase().trim() === "bogra" ? "bogura" : district.toLowerCase().trim();

  // Bangladesh seasonal crop mapping
  const CROP_BY_SEASON = {
    spring:    ["maize", "rice", "jute"],
    summer:    ["rice", "jute"],
    rabi:      ["wheat", "maize", "potato", "mustard"],
    "kharif-1":["rice", "jute", "maize"],
    "kharif-2":["rice"],
  };

  const seasonKey = season.toLowerCase().replace(/\s+/g, "");
  const crops = CROP_BY_SEASON[seasonKey] || CROP_BY_SEASON.rabi;

  // Climate defaults per season (North Bengal averages)
  const SEASON_CLIMATE = {
    spring:    { temp_avg: 28, precipitation: 8,  humidity: 72, soil_moisture: 0.55, solar_rad: 20 },
    summer:    { temp_avg: 31, precipitation: 14, humidity: 82, soil_moisture: 0.72, solar_rad: 22 },
    rabi:      { temp_avg: 18, precipitation: 2,  humidity: 52, soil_moisture: 0.40, solar_rad: 15 },
    "kharif-1":{ temp_avg: 30, precipitation: 10, humidity: 76, soil_moisture: 0.60, solar_rad: 21 },
    "kharif-2":{ temp_avg: 29, precipitation: 16, humidity: 84, soil_moisture: 0.75, solar_rad: 18 },
  };
  const climate = SEASON_CLIMATE[seasonKey] || SEASON_CLIMATE.rabi;

  // সব crops parallel এ predict করো
  const results = await Promise.all(
    crops.map(async (crop) => {
      try {
        const result = await predictCropSuitability({ district, crop, ...climate });
        const suitMap = { High: 90, Medium: 65, Low: 35 };
        return {
          name:        crop.charAt(0).toUpperCase() + crop.slice(1),
          suit:        Math.round((suitMap[result.suitability] || 50) * result.confidence),
          suitability: result.suitability,
          recommendation: result.recommendation,
          best_sow_month: result.best_sow_month,
          model_used:     result.model_used,
        };
      } catch {
        return { name: crop.charAt(0).toUpperCase() + crop.slice(1), suit: 50, suitability: "Medium" };
      }
    })
  );

  return { crops: results.sort((a, b) => b.suit - a.suit), simulated: false };
}
