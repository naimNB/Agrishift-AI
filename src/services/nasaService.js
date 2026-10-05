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
export async function fetchNasaData(district = "rangpur", start = null, end = null) {
  const params = new URLSearchParams({ district });
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
    location:          `${district.charAt(0).toUpperCase() + district.slice(1)}, Bangladesh`,
    district,
    coordinates:       data.coordinates || { lat: 24.747, lon: 90.391 },
    temperature:       summary.temp_avg?.mean    ?? 28,
    rainfall:          summary.precipitation?.total ?? 120,
    soilMoisture:      Math.round((summary.soil_moisture?.mean ?? 0.5) * 100),
    ndvi:              summary.solar_rad?.mean   ? (summary.solar_rad.mean / 30).toFixed(2) : "0.75",
    vegetationHealth:  _getVegetationHealth(summary.temp_avg?.mean, summary.precipitation?.total),
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
  if (!res.ok) return { districts: ["rangpur", "dinajpur", "bogra", "rajshahi"] };
  return res.json();
}

/**
 * Legacy export — পুরানো components এর জন্য।
 */
export const SIMULATED_DATA = {
  location: "Rangpur, Bangladesh",
  coordinates: { lat: 25.7439, lon: 89.2752 },
  temperature: 28,
  rainfall: 120,
  soilMoisture: 55,
  ndvi: 0.75,
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
