import { useState, useEffect, useCallback } from "react";
import {
  Satellite,
  Thermometer,
  CloudRain,
  Droplets,
  SunMedium,
  Wind,
  Layers,
  RefreshCw,
  AlertCircle,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  Sparkles,
  Tractor,
  Compass,
  ShieldCheck,
  Sprout,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import { api } from "../services/api";
import HistoricalClimateTrends from "./HistoricalClimateTrends";
import FarmMap from "./FarmMap";
import CropRecommendation from "./CropRecommendation";
import ClimateRisk from "./ClimateRisk";
import FarmerAdvisory from "./FarmerAdvisory";

const DISTRICT_METADATA = {
  bogura: {
    name: "Bogura",
    division: "Rajshahi Division",
    zone: "Central Agricultural Hub & Karatoya Basin",
    coords: "24.8465° N, 89.3773° E",
    lat: 24.8465,
    lon: 89.3773,
    primaryCrops: "Rice (Boro/Aman), Potato, Mustard, Vegetables",
  },
  rangpur: {
    name: "Rangpur",
    division: "Rangpur Division",
    zone: "Tista River Floodplain",
    coords: "25.7439° N, 89.2752° E",
    lat: 25.7439,
    lon: 89.2752,
    primaryCrops: "Rice, Maize, Potato, Tobacco, Wheat",
  },
  dinajpur: {
    name: "Dinajpur",
    division: "Rangpur Division",
    zone: "Northern Himalayan Piedmont Plains",
    coords: "25.6279° N, 88.6338° E",
    lat: 25.6279,
    lon: 88.6338,
    primaryCrops: "Aromatic Rice (Kataribhog), Wheat, Maize, Litchi",
  },
  rajshahi: {
    name: "Rajshahi",
    division: "Rajshahi Division",
    zone: "High Barind Tract (Drought-Prone)",
    coords: "24.3636° N, 88.6241° E",
    lat: 24.3636,
    lon: 88.6241,
    primaryCrops: "Wheat, Mango, Boro Rice (AWD), Pulses, Mustard",
  },
  sylhet: {
    name: "Sylhet",
    division: "Sylhet Division",
    zone: "Northeastern Surma Basin (Wetland / Haor)",
    coords: "24.8949° N, 91.8687° E",
    lat: 24.8949,
    lon: 91.8687,
    primaryCrops: "Tea, Boro Rice (Flash-Flood Prone), Citrus",
  },
};

// Helper: Format Date object to YYYY-MM-DD
function formatDate(d) {
  return d.toISOString().split("T")[0];
}

// Compute safe date presets given NASA's ~3 day operational lag
function getDatePresets() {
  const maxEnd = new Date();
  maxEnd.setDate(maxEnd.getDate() - 3);

  const d7 = new Date(maxEnd);
  d7.setDate(d7.getDate() - 7);

  const d14 = new Date(maxEnd);
  d14.setDate(d14.getDate() - 14);

  const d30 = new Date(maxEnd);
  d30.setDate(d30.getDate() - 30);

  return {
    maxEndDate: formatDate(maxEnd),
    p7: { label: "Past 7 Days", start: formatDate(d7), end: formatDate(maxEnd) },
    p14: { label: "Past 14 Days", start: formatDate(d14), end: formatDate(maxEnd) },
    p30: { label: "Past 30 Days", start: formatDate(d30), end: formatDate(maxEnd) },
  };
}

export default function ClimateDashboard() {
  const presets = getDatePresets();

  // Saved farm portfolio state
  const [userFarms, setUserFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [loadingFarms, setLoadingFarms] = useState(false);

  // Unified Location & Date state
  const [selectedDistrict, setSelectedDistrict] = useState("bogura");
  const [customCoords, setCustomCoords] = useState(null); // { lat, lon, label, districtId, isCustom }
  const [activePreset, setActivePreset] = useState("p14");
  const [startDate, setStartDate] = useState(presets.p14.start);
  const [endDate, setEndDate] = useState(presets.p14.end);

  // Climate telemetry state
  const [climateData, setClimateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTelemetryTable, setShowTelemetryTable] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  // Fetch saved farms from local storage or backend
  useEffect(() => {
    let isMounted = true;
    const loadFarms = () => {
      setLoadingFarms(true);
      api
        .getFarms()
        .then((farms) => {
          if (isMounted) {
            setUserFarms(farms || []);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch user farms for dashboard:", err.message);
        })
        .finally(() => {
          if (isMounted) setLoadingFarms(false);
        });
    };

    loadFarms();

    const handleFarmsUpdated = () => {
      loadFarms();
    };

    window.addEventListener("agrishift:farms-updated", handleFarmsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener("agrishift:farms-updated", handleFarmsUpdated);
    };
  }, []);

  // Fetch NASA climate telemetry from FastAPI backend
  const fetchTelemetry = useCallback(
    async (district, start, end, lat = null, lon = null) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getClimateData({
          district: lat != null && lon != null ? undefined : district,
          lat: lat != null ? lat : undefined,
          lon: lon != null ? lon : undefined,
          start: start || undefined,
          end: end || undefined,
        });
        setClimateData(res);
        setLastFetchedAt(new Date());
      } catch (err) {
        console.error("Failed to load NASA climate data:", err);
        setError(
          err.message ||
            "Unable to retrieve NASA POWER climate data. Please verify the FastAPI backend server is running."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Main telemetry sync effect on district/coords/date change
  useEffect(() => {
    if (customCoords) {
      fetchTelemetry(null, startDate, endDate, customCoords.lat, customCoords.lon);
    } else {
      fetchTelemetry(selectedDistrict, startDate, endDate);
    }
  }, [selectedDistrict, startDate, endDate, customCoords, fetchTelemetry]);

  // Global event listener for coordinate / district loading from FarmMap and MyFarmManager
  useEffect(() => {
    const handleLoadClimateLocation = (e) => {
      const { district, lat, lon, label } = e.detail || {};
      if (lat != null && lon != null) {
        setCustomCoords({
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          label: label || `GPS (${parseFloat(lat).toFixed(2)}°, ${parseFloat(lon).toFixed(2)}°)`,
          districtId: district || selectedDistrict,
          isCustom: true,
        });
        if (district) {
          setSelectedDistrict(district);
        }
      } else if (district) {
        setCustomCoords(null);
        setSelectedDistrict(district);
      }
    };

    window.addEventListener("agrishift:load-climate-location", handleLoadClimateLocation);
    return () => window.removeEventListener("agrishift:load-climate-location", handleLoadClimateLocation);
  }, [selectedDistrict]);

  // Handle farm selection from logged-in user farm portfolio
  const handleSelectFarm = (farmId) => {
    setSelectedFarmId(farmId);
    if (!farmId) {
      setCustomCoords(null);
      return;
    }
    const farm = userFarms.find((f) => String(f.id) === String(farmId));
    if (farm) {
      const lat = parseFloat(farm.latitude);
      const lon = parseFloat(farm.longitude);
      setCustomCoords({
        lat,
        lon,
        label: `${farm.farm_name} (${farm.current_crop || "Farm"})`,
        districtId: farm.district || "bogura",
        isCustom: true,
      });
      if (farm.district) {
        setSelectedDistrict(farm.district);
      }
    }
  };

  // Handle location selection from interactive Map
  const handleLocationSelectFromMap = (coords) => {
    setSelectedFarmId(""); // Deselect farm when custom map point clicked
    if (coords.isCustom) {
      setCustomCoords({
        lat: coords.lat,
        lon: coords.lon,
        label: coords.label || `GPS (${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°)`,
        districtId: coords.districtId || selectedDistrict,
        isCustom: true,
      });
      if (coords.districtId) {
        setSelectedDistrict(coords.districtId);
      }
    } else if (coords.districtId) {
      setCustomCoords(null);
      setSelectedDistrict(coords.districtId);
    }
  };

  // Handle preset selection
  const handlePresetClick = (presetKey) => {
    setActivePreset(presetKey);
    const p = presets[presetKey];
    if (p) {
      setStartDate(p.start);
      setEndDate(p.end);
    }
  };

  const districtMeta = customCoords
    ? {
        name: customCoords.label || "Custom Farm Coordinates",
        division: "Custom Geographic Target",
        zone: `GPS Coordinates: ${customCoords.lat.toFixed(4)}°N, ${customCoords.lon.toFixed(4)}°E`,
        coords: `${customCoords.lat.toFixed(4)}° N, ${customCoords.lon.toFixed(4)}° E`,
        lat: customCoords.lat,
        lon: customCoords.lon,
        primaryCrops: "Custom Parcel GIS Telemetry",
      }
    : DISTRICT_METADATA[selectedDistrict] || DISTRICT_METADATA.bogura;

  const summary = climateData?.summary || {};
  const dailyRecords = climateData?.data || [];

  // Soil wetness interpretation
  const soilWetnessPercent =
    summary.avg_soil_moisture != null
      ? (summary.avg_soil_moisture > 1
          ? summary.avg_soil_moisture
          : summary.avg_soil_moisture * 100
        ).toFixed(1)
      : null;

  const getSoilStatusBadge = (val) => {
    if (val == null) return { text: "No Data", color: "bg-gray-500/20 text-gray-300" };
    const num = parseFloat(val);
    if (num < 25) return { text: "Drought / Low Moisture", color: "bg-red-500/20 text-red-300 border-red-500/30" };
    if (num < 50) return { text: "Moderate / AWD Suitable", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    if (num < 80) return { text: "Optimal Saturation", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    return { text: "Field Saturated", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
  };

  const soilStatus = getSoilStatusBadge(soilWetnessPercent);

  return (
    <section
      id="dashboard"
      className="relative py-20 px-4 sm:px-6 lg:px-12 bg-[#060b17] text-white overflow-hidden border-t border-white/5"
    >
      {/* Hidden anchor bookmark for backward compatibility */}
      <div id="climate-dashboard" className="absolute -top-10" />

      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-cyan-600/10 via-emerald-600/10 to-transparent rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 right-10 w-[450px] h-[450px] bg-blue-600/8 rounded-full blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ── SECTION HEADER ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-sm shadow-emerald-500/10">
              <Satellite className="w-3.5 h-3.5 animate-pulse" />
              Integrated Agroclimatology & Intelligence Hub
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              AgriShift <span className="gradient-text">Application Dashboard</span>
            </h2>
            <p className="mt-2 text-gray-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              Unified agricultural intelligence platform synchronizing live NASA POWER telemetry,
              historical trends, multi-crop ranking, early hazard diagnostics, and interactive GIS mapping.
            </p>
          </div>

          {/* Attribution & Gateway Status */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    error ? "bg-red-400" : "bg-emerald-400"
                  } opacity-75`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    error ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
              </span>
              <span>FastAPI Backend: {error ? "Error" : "Synchronized"}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (customCoords) {
                  fetchTelemetry(null, startDate, endDate, customCoords.lat, customCoords.lon);
                } else {
                  fetchTelemetry(selectedDistrict, startDate, endDate);
                }
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              {loading ? "Syncing..." : "Refresh Telemetry"}
            </button>
          </div>
        </div>

        {/* ── UNIFIED CONTROL STRIP (Location Selector + Farm Selector if Logged In + Dates) ── */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/40 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* 1. Location Selector (District Hub) */}
            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="dashboard-district-select"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Target Location / District
                </label>
                {customCoords && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCoords(null);
                      setSelectedFarmId("");
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Reset Location
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  id="dashboard-district-select"
                  value={customCoords ? "custom" : selectedDistrict}
                  onChange={(e) => {
                    if (e.target.value === "custom") return;
                    setCustomCoords(null);
                    setSelectedFarmId("");
                    setSelectedDistrict(e.target.value);
                  }}
                  disabled={loading}
                  className="w-full appearance-none bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                >
                  {customCoords && (
                    <option value="custom">
                      📍 {customCoords.label} ({customCoords.lat.toFixed(2)}°N, {customCoords.lon.toFixed(2)}°E)
                    </option>
                  )}
                  <optgroup label="North Bengal Stations">
                    <option value="bogura">Bogura — Central Agro Hub</option>
                    <option value="rangpur">Rangpur — Tista Basin Plain</option>
                    <option value="dinajpur">Dinajpur — Himalayan Foothills</option>
                    <option value="rajshahi">Rajshahi — High Barind Tract</option>
                  </optgroup>
                  <optgroup label="Eastern Stations">
                    <option value="sylhet">Sylhet — Surma Basin / Haor</option>
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Farm Selector */}
            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Tractor className="w-3.5 h-3.5 text-emerald-400" />
                  Farm Parcel Selector
                </label>
                <a
                  href="#my-farm"
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  Manage Farms
                </a>
              </div>

              <div className="relative">
                <select
                  value={selectedFarmId}
                  onChange={(e) => handleSelectFarm(e.target.value)}
                  disabled={loadingFarms || userFarms.length === 0}
                  className="w-full appearance-none bg-black/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400 transition cursor-pointer disabled:opacity-60"
                >
                  <option value="">
                    {userFarms.length === 0
                      ? "(No farms saved yet)"
                      : "— Select Registered Farm —"}
                  </option>
                  {userFarms.map((f) => (
                    <option key={f.id} value={f.id}>
                      🌾 {f.farm_name} ({f.district} • {f.area} {f.area_unit})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Observation Period Presets */}
            <div className="md:col-span-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                NASA Time Window
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {["p7", "p14", "p30"].map((key) => {
                  const p = presets[key];
                  const isActive = activePreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetClick(key)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-sm"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3 mb-8 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (customCoords) {
                  fetchTelemetry(null, startDate, endDate, customCoords.lat, customCoords.lon);
                } else {
                  fetchTelemetry(selectedDistrict, startDate, endDate);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold text-white transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── 3. NASA CLIMATE SUMMARY (6 KPI METRIC CARDS) ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Satellite className="w-4 h-4 text-emerald-400" />
              NASA Climate Telemetry Summary ({districtMeta.name})
            </div>
            <div className="text-[11px] font-mono text-gray-400">
              Period: {startDate} to {endDate}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Temperature */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Avg Temp</span>
                <Thermometer className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {summary.avg_temperature != null ? `${summary.avg_temperature}°C` : "—"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Min: {summary.min_temperature ?? "—"}° | Max: {summary.max_temperature ?? "—"}°
              </div>
            </div>

            {/* 2. Precipitation */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Rain</span>
                <CloudRain className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-sky-300 font-mono">
                {summary.total_precipitation != null ? `${summary.total_precipitation} mm` : "—"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Daily Avg: {dailyRecords.length > 0 ? (summary.total_precipitation / dailyRecords.length).toFixed(1) : "—"} mm/d
              </div>
            </div>

            {/* 3. Humidity */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Humidity</span>
                <Droplets className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-teal-300 font-mono">
                {summary.avg_humidity != null ? `${summary.avg_humidity}%` : "—"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Ambient 2m Vapor
              </div>
            </div>

            {/* 4. Soil Wetness */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Soil Wetness</span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-300 font-mono">
                {soilWetnessPercent != null ? `${soilWetnessPercent}%` : "—"}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 font-semibold truncate">
                {soilStatus.text}
              </div>
            </div>

            {/* 5. Solar Radiation */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Solar Flux</span>
                <SunMedium className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {summary.avg_solar_radiation != null ? `${summary.avg_solar_radiation}` : "—"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                kWh/m²/day
              </div>
            </div>

            {/* 6. Wind Speed */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Wind Velocity</span>
                <Wind className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-300 font-mono">
                {summary.avg_wind_speed != null ? `${summary.avg_wind_speed} m/s` : "—"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Surface Anemometer
              </div>
            </div>
          </div>
        </div>

        {/* ── CORE DASHBOARD GRID (Desktop 12-Column Grid / Mobile Cleanly Stacked) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          {/* ══ LEFT COLUMN (7 Cols): Map, Historical Climate Charts, Farmer Advisory ══ */}
          <div className="lg:col-span-7 space-y-8">
            {/* 8. Interactive Map Component */}
            <div id="farm-map" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  Farm Location & Agricultural GIS Map
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Interactive OpenStreetMap / CartoDB
                </div>
              </div>
              <FarmMap
                embedded={true}
                selectedCoords={
                  customCoords || {
                    lat: districtMeta.lat || 24.8465,
                    lon: districtMeta.lon || 89.3773,
                    label: districtMeta.name,
                    isCustom: false,
                    districtId: selectedDistrict,
                  }
                }
                onLocationSelect={handleLocationSelectFromMap}
              />
            </div>

            {/* 4. Historical Climate Charts Component */}
            <div id="historical-trends" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Historical Climate Trends & Microclimate Series
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  {dailyRecords.length} Observed Points
                </div>
              </div>
              <HistoricalClimateTrends
                dailyRecords={dailyRecords}
                districtName={districtMeta.name}
                loading={loading}
              />
            </div>

            {/* 7. Actionable Farmer Advisory Component */}
            <div id="farmer-advisory" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  Agronomic Advisories & Mitigation Protocol
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Deterministic Directives
                </div>
              </div>
              <FarmerAdvisory embedded={true} selectedDistrict={selectedDistrict} />
            </div>
          </div>

          {/* ══ RIGHT COLUMN (5 Cols): Climate Risk Intelligence, Crop Ranking Engine ══ */}
          <div className="lg:col-span-5 space-y-8">
            {/* 6. Climate Risk Intelligence Component */}
            <div id="climate-risk" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Hazard Intelligence & Early Warning
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Drought • Flood • Heat
                </div>
              </div>
              <ClimateRisk embedded={true} selectedDistrict={selectedDistrict} />
            </div>

            {/* 5. Crop Ranking & Suitability Component */}
            <div id="crop-recommendation" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  Crop Recommendation & Factor Scoring
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Ranked Candidates
                </div>
              </div>
              <CropRecommendation embedded={true} selectedDistrict={selectedDistrict} />
            </div>
          </div>
        </div>

        {/* ── OPTIONAL RAW DAILY OBSERVATION TELEMETRY TABLE ── */}
        {dailyRecords.length > 0 && (
          <div className="rounded-3xl bg-black/40 border border-white/10 overflow-hidden mb-8 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setShowTelemetryTable(!showTelemetryTable)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-gray-200">
                  Daily Observation Telemetry ({dailyRecords.length} recorded days)
                </span>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Inspect raw parameters across time window
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                {showTelemetryTable ? "Hide Daily Series" : "Inspect Raw Daily Telemetry"}
                {showTelemetryTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showTelemetryTable && (
              <div className="px-6 pb-6 pt-2 overflow-x-auto border-t border-white/10">
                <table className="w-full text-left text-xs font-mono text-gray-300 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="py-2.5 pr-4 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Avg Temp (°C)</th>
                      <th className="py-2.5 px-3 font-semibold">Max (°C)</th>
                      <th className="py-2.5 px-3 font-semibold">Min (°C)</th>
                      <th className="py-2.5 px-3 font-semibold">Rain (mm)</th>
                      <th className="py-2.5 px-3 font-semibold">Humidity (%)</th>
                      <th className="py-2.5 px-3 font-semibold">Solar (kWh/m²)</th>
                      <th className="py-2.5 px-3 font-semibold">Wind (m/s)</th>
                      <th className="py-2.5 pl-3 font-semibold">Soil Moisture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dailyRecords.map((r) => (
                      <tr key={r.date} className="hover:bg-white/5 transition">
                        <td className="py-2 pr-4 text-emerald-300 font-medium">{r.date}</td>
                        <td className="py-2 px-3">{r.temp_avg != null ? r.temp_avg : "—"}</td>
                        <td className="py-2 px-3 text-orange-300">{r.temp_max != null ? r.temp_max : "—"}</td>
                        <td className="py-2 px-3 text-blue-300">{r.temp_min != null ? r.temp_min : "—"}</td>
                        <td className="py-2 px-3 text-sky-300 font-semibold">
                          {r.precipitation != null ? `${r.precipitation} mm` : "—"}
                        </td>
                        <td className="py-2 px-3">{r.humidity != null ? `${r.humidity}%` : "—"}</td>
                        <td className="py-2 px-3">{r.solar_rad != null ? r.solar_rad : "—"}</td>
                        <td className="py-2 px-3">{r.wind_speed != null ? r.wind_speed : "—"}</td>
                        <td className="py-2 pl-3 text-emerald-400">
                          {r.soil_moisture != null
                            ? `${(r.soil_moisture * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 9. DATA SOURCE / LAST UPDATED INFORMATION BANNER ── */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-gray-400">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-300">Data Source:</span>
              <span className="text-emerald-400 font-medium">
                NASA Langley Research Center POWER Project — Daily Agroclimatology API v2.0
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-3xl">
              Parameters: <span className="font-mono text-gray-300">T2M, PRECTOTCORR, RH2M, GWETROOT, ALLSKY_SFC_SW_DWN, WS2M</span>.
              Observation-based integrations undergo quality validation with an operational latency of ~3 days.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {lastFetchedAt && (
              <span className="font-mono text-[11px] text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                Last Updated: {lastFetchedAt.toLocaleTimeString()}
              </span>
            )}
            <a
              href="https://power.larc.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 transition"
            >
              NASA POWER API
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
