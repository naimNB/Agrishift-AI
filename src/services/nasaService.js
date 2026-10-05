/**
 * nasaService.js
 * Real NASA POWER API via backend: GET /api/nasa/climate
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * নির্দিষ্ট district এর climate data backend থেকে fetch করে।
 * @param {string} district  - e.g. "rangpur", "dinajpur", "bogra"
 * @param {string} [start]   - "YYYY-MM-DD"
 * @param {string} [end]     - "YYYY-MM-DD"
 */
export async function fetchNasaData(district = "bogura", start = null, end = null) {
  // Normalize spelling aliases (e.g. bogra -> bogura)
  const normDistrict = district.toLowerCase().trim() === "bogra" ? "bogura" : district.toLowerCase().trim();
  const params = new URLSearchParams({ district: normDistrict });
  if (start) params.append("start", start);
  if (end)   params.append("end",   end);

  const res = await fetch(`${API_BASE}/api/nasa/climate?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `NASA API error (${res.status})`);
  }

  const data = await res.json();

  // Components এর জন্য flat structure বানাও
  const summary = data.summary || {};
  return {
    location:          `${normDistrict.charAt(0).toUpperCase() + normDistrict.slice(1)}, Bangladesh`,
    district:          normDistrict,
    coordinates:       data.coordinates || { lat: 24.8465, lon: 89.3773 },
    temperature:       summary.temp_avg?.mean    ?? summary.avg_temperature ?? 28,
    rainfall:          summary.precipitation?.total ?? summary.total_precipitation ?? 120,
    soilMoisture:      Math.round(((summary.soil_moisture?.mean ?? summary.avg_soil_moisture) ?? 0.45) * 100),
    ndvi:              summary.solar_rad?.mean ? "0.82" : "0.78", // Prototype vegetative indicator
    vegetationHealth:  _getVegetationHealth(summary.temp_avg?.mean ?? summary.avg_temperature, summary.precipitation?.total ?? summary.total_precipitation),
    lastUpdated:       data.end_date || new Date().toISOString().split("T")[0],
    // Raw data for charts
    rawSummary: summary,
    startDate:  data.start_date,
    endDate:    data.end_date,
  };
}

/**
 * Available districts list fetch করো।
 */
export async function fetchDistricts() {
  const res = await fetch(`${API_BASE}/api/nasa/districts`);
  if (!res.ok) return { districts: ["bogura", "rangpur", "dinajpur", "rajshahi", "sylhet"] };
  return res.json();
}

/**
 * Baseline prototype data for UI state and previews.
 */
export const SIMULATED_DATA = {
  location: "Bogura, Bangladesh",
  coordinates: { lat: 24.8465, lon: 89.3773 },
  temperature: 28,
  rainfall: 120,
  soilMoisture: 45,
  ndvi: 0.82,
  vegetationHealth: "Healthy",
  lastUpdated: new Date().toISOString(),
};


// ── Helpers ───────────────────────────────────────────────────────────────────

function _getVegetationHealth(tempMean, totalRain) {
  if (!tempMean || !totalRain) return "Moderate";
  if (tempMean >= 24 && tempMean <= 32 && totalRain >= 80) return "Healthy";
  if (tempMean > 35 || totalRain < 30) return "Stressed";
  return "Moderate";
}
