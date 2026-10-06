/**
 * api.js — Centralized API Service for AgriShift AI
 * Interfaces with the FastAPI Backend (NASA POWER telemetry, ML recommendations, Auth)
 * Supports configurable backend URL via VITE_API_BASE_URL (or VITE_API_URL fallback).
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

export const TOKEN_STORAGE_KEY = "agrishift_auth_token";
export const FARMS_STORAGE_KEY = "agrishift_saved_farms";

export const DEFAULT_FARMS = [
  {
    id: 1,
    farm_name: "Barind Maize Field",
    district: "rajshahi",
    latitude: 24.3636,
    longitude: 88.6241,
    area: 4.5,
    area_unit: "bigha",
    soil_type: "High Barind Clay",
    current_crop: "Maize",
    planting_date: "2026-03-01",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    farm_name: "Karatoya Basin Rice Parcel",
    district: "bogura",
    latitude: 24.8465,
    longitude: 89.3773,
    area: 3.0,
    area_unit: "bigha",
    soil_type: "Alluvial Loam",
    current_crop: "Rice",
    planting_date: "2026-02-15",
    created_at: new Date().toISOString(),
  },
];

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function getStoredFarms() {
  try {
    const raw = localStorage.getItem(FARMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(DEFAULT_FARMS));
      return DEFAULT_FARMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FARMS;
  } catch {
    return DEFAULT_FARMS;
  }
}

export function setStoredFarms(farms) {
  try {
    localStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(farms));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("agrishift:farms-updated", { detail: farms }));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generic request wrapper with structured error handling & JWT injection
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message =
        errorData.detail ||
        `HTTP Error ${res.status}: ${res.statusText || "Server error"}`;
      
      // Auto-handle expired or invalid tokens for authenticated requests
      if (res.status === 401 && token && !endpoint.includes("/api/auth/login")) {
        setStoredToken(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("agrishift:unauthorized", { detail: { message } })
          );
        }
      }

      throw new Error(message);
    }
    return await res.json();
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(
        `Unable to reach backend server at ${API_BASE_URL}. Please ensure FastAPI is running.`
      );
    }
    throw err;
  }
}

export const api = {
  /**
   * User Authentication
   */
  async register({ name, email, password }) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login({ email, password }) {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.access_token) {
      setStoredToken(res.access_token);
    }
    return res;
  },

  async getMe() {
    return request("/api/auth/me");
  },

  logout() {
    setStoredToken(null);
  },

  /**
   * Farm Management (CRUD)
   * Seamlessly persists to local browser storage without requiring login.
   * If an auth token is present, syncs with backend database.
   */
  async getFarms() {
    const token = getStoredToken();
    if (token) {
      try {
        return await request("/api/farms");
      } catch (err) {
        console.warn("Backend getFarms unavailable, using local farms:", err.message);
      }
    }
    return getStoredFarms();
  },

  async getFarm(farmId) {
    const token = getStoredToken();
    if (token) {
      try {
        return await request(`/api/farms/${farmId}`);
      } catch (err) {
        console.warn("Backend getFarm unavailable, using local farms:", err.message);
      }
    }
    const farms = getStoredFarms();
    const found = farms.find((f) => String(f.id) === String(farmId));
    if (!found) throw new Error(`Farm with id ${farmId} not found.`);
    return found;
  },

  async createFarm(farmData) {
    const token = getStoredToken();
    if (token) {
      try {
        const created = await request("/api/farms", {
          method: "POST",
          body: JSON.stringify(farmData),
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("agrishift:farms-updated", { detail: created }));
        }
        return created;
      } catch (err) {
        console.warn("Backend createFarm unavailable, saving to local storage:", err.message);
      }
    }
    const farms = getStoredFarms();
    const created = {
      id: Date.now(),
      farm_name: (farmData.farm_name || "").trim(),
      district: (farmData.district || "bogura").trim(),
      latitude: parseFloat(farmData.latitude) || 0,
      longitude: parseFloat(farmData.longitude) || 0,
      area: farmData.area != null && farmData.area !== "" ? parseFloat(farmData.area) : null,
      area_unit: farmData.area_unit || "bigha",
      soil_type: farmData.soil_type || null,
      current_crop: farmData.current_crop || null,
      planting_date: farmData.planting_date || null,
      created_at: new Date().toISOString(),
    };
    const updated = [created, ...farms];
    setStoredFarms(updated);
    return created;
  },

  async updateFarm(farmId, farmData) {
    const token = getStoredToken();
    if (token) {
      try {
        const updated = await request(`/api/farms/${farmId}`, {
          method: "PUT",
          body: JSON.stringify(farmData),
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("agrishift:farms-updated", { detail: updated }));
        }
        return updated;
      } catch (err) {
        console.warn("Backend updateFarm unavailable, saving to local storage:", err.message);
      }
    }
    const farms = getStoredFarms();
    let updatedFarm = null;
    const updated = farms.map((f) => {
      if (String(f.id) === String(farmId)) {
        updatedFarm = {
          ...f,
          ...farmData,
          latitude: farmData.latitude != null ? parseFloat(farmData.latitude) : f.latitude,
          longitude: farmData.longitude != null ? parseFloat(farmData.longitude) : f.longitude,
          area: farmData.area != null && farmData.area !== "" ? parseFloat(farmData.area) : f.area,
          updated_at: new Date().toISOString(),
        };
        return updatedFarm;
      }
      return f;
    });
    if (!updatedFarm) throw new Error(`Farm with id ${farmId} not found.`);
    setStoredFarms(updated);
    return updatedFarm;
  },

  async deleteFarm(farmId) {
    const token = getStoredToken();
    if (token) {
      try {
        const result = await request(`/api/farms/${farmId}`, {
          method: "DELETE",
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("agrishift:farms-updated", { detail: { id: farmId } }));
        }
        return result;
      } catch (err) {
        console.warn("Backend deleteFarm unavailable, updating local storage:", err.message);
      }
    }
    const farms = getStoredFarms();
    const updated = farms.filter((f) => String(f.id) !== String(farmId));
    setStoredFarms(updated);
    return { detail: "Farm deleted successfully", id: farmId };
  },
  /**
   * Fetch list of supported agricultural districts in Bangladesh
   */
  async getDistricts() {
    return request("/api/nasa/districts");
  },

  /**
   * Fetch daily NASA POWER climate data with summary statistics
   * @param {Object} options
   * @param {string} [options.district='bogura'] - District name (bogura, rangpur, dinajpur, rajshahi, sylhet)
   * @param {number} [options.lat] - Latitude coordinate
   * @param {number} [options.lon] - Longitude coordinate
   * @param {string} [options.start] - Start date (YYYY-MM-DD)
   * @param {string} [options.end] - End date (YYYY-MM-DD)
   */
  async getClimateData({ district = null, lat = null, lon = null, start = null, end = null } = {}) {
    const params = new URLSearchParams();
    if (lat !== null && lat !== undefined && lon !== null && lon !== undefined) {
      params.append("latitude", lat);
      params.append("longitude", lon);
    } else {
      const distName = district || "bogura";
      const normDistrict = distName.toLowerCase().trim() === "bogra" ? "bogura" : distName.toLowerCase().trim();
      params.append("district", normDistrict);
    }
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    return request(`/api/nasa/climate?${params.toString()}`);
  },

  /**
   * Fetch aggregated summary statistics without full daily array
   */
  async getClimateSummary({ district = null, lat = null, lon = null, start = null, end = null } = {}) {
    const params = new URLSearchParams();
    if (lat !== null && lat !== undefined && lon !== null && lon !== undefined) {
      params.append("latitude", lat);
      params.append("longitude", lon);
    } else {
      const distName = district || "bogura";
      const normDistrict = distName.toLowerCase().trim() === "bogra" ? "bogura" : distName.toLowerCase().trim();
      params.append("district", normDistrict);
    }
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    return request(`/api/nasa/climate/summary?${params.toString()}`);
  },

  /**
   * Rank all candidate crops based on climate & soil parameters
   * @param {Object} payload - { location/district, temp_avg, precipitation, humidity, soil_moisture, solar_rad, wind_speed, use_ml }
   */
  async rankCrops(payload) {
    return request("/api/predictions/rank-crops", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Run crop suitability prediction for a single crop
   * @param {Object} payload - { district, crop, temp_avg, precipitation, humidity, soil_moisture, solar_rad }
   */
  async predictCropSuitability(payload) {
    return request("/api/predictions/crop-suitability", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch agroclimatic risk analysis (Drought, Flood/Excess Rain, Heat Stress)
   * @param {Object} options
   */
  async getClimateRisk({
    district = "bogura",
    start = null,
    end = null,
    temp_max = null,
    precipitation = null,
    soil_moisture = null,
    humidity = null,
  } = {}) {
    const normDistrict =
      district.toLowerCase().trim() === "bogra" ? "bogura" : district.toLowerCase().trim();
    const params = new URLSearchParams({ district: normDistrict });
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    if (temp_max !== null && temp_max !== undefined) params.append("temp_max", temp_max);
    if (precipitation !== null && precipitation !== undefined)
      params.append("precipitation", precipitation);
    if (soil_moisture !== null && soil_moisture !== undefined)
      params.append("soil_moisture", soil_moisture);
    if (humidity !== null && humidity !== undefined)
      params.append("humidity", humidity);
    return request(`/api/risk/climate?${params.toString()}`);
  },

  /**
   * Fetch actionable farmer advisories (Irrigation, Crop, Heat, Excess Rain, Sowing)
   * @param {Object} options
   * @param {string} [options.district='bogura']
   * @param {string} [options.crop]
   */
  async getFarmerAdvisories({ district = "bogura", crop = null } = {}) {
    const normDistrict =
      district.toLowerCase().trim() === "bogra" ? "bogura" : district.toLowerCase().trim();
    const params = new URLSearchParams({ district: normDistrict });
    if (crop) params.append("crop", crop);
    return request(`/api/advisory?${params.toString()}`);
  },

  /**
   * Backend health check
   */
  async getHealth() {
    return request("/health");
  },
};

export default api;
