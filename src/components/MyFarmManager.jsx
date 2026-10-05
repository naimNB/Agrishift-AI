import { useState, useEffect, useCallback } from "react";
import {
  Tractor,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Compass,
  Calendar,
  Layers,
  Sprout,
  Satellite,
  Sliders,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  LogOut,
  User,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoginCard from "./LoginCard";

const DISTRICT_COORDS = {
  bogura: { lat: 24.8465, lon: 89.3773 },
  rangpur: { lat: 25.7439, lon: 89.2752 },
  dinajpur: { lat: 25.6279, lon: 88.6338 },
  rajshahi: { lat: 24.3636, lon: 88.6241 },
  sylhet: { lat: 24.8949, lon: 91.8687 },
};

const COMMON_CROPS = ["Rice", "Potato", "Mustard", "Wheat", "Maize", "Jute", "Litchi", "Mango", "Vegetables"];
const COMMON_SOILS = ["Alluvial Loam", "Clay Loam", "Sandy Loam", "High Barind Clay", "Silty Loam", "Peat Soil"];

export default function MyFarmManager() {
  // Global Auth Context
  const { user, logout, loading: authLoading } = useAuth();

  // Farms state
  const [farms, setFarms] = useState([]);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farmError, setFarmError] = useState(null);
  const [farmNotice, setFarmNotice] = useState(null);

  // Modal / Form state (Add or Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState(null);
  const [formData, setFormData] = useState({
    farm_name: "",
    district: "bogura",
    latitude: 24.8465,
    longitude: 89.3773,
    area: 3.0,
    area_unit: "bigha",
    soil_type: "Alluvial Loam",
    current_crop: "Rice",
    planting_date: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Farm-specific climate preview
  const [farmClimate, setFarmClimate] = useState(null);
  const [loadingClimate, setLoadingClimate] = useState(false);

  // Fetch list of farms for logged-in user
  const fetchFarms = useCallback(async () => {
    if (!user) return;
    setFarmsLoading(true);
    setFarmError(null);
    try {
      const list = await api.getFarms();
      setFarms(list);
      // Auto select first farm if none selected
      if (list.length > 0 && !selectedFarm) {
        setSelectedFarm(list[0]);
      }
    } catch (err) {
      if (err.message && (err.message.includes("401") || err.message.includes("Could not validate credentials"))) {
        logout();
        setFarmError("Your session has expired. Please sign in again.");
      } else {
        setFarmError(err.message || "Failed to load farm portfolio.");
      }
    } finally {
      setFarmsLoading(false);
    }
  }, [user, selectedFarm, logout]);

  useEffect(() => {
    if (user) {
      fetchFarms();
    } else {
      setFarms([]);
      setSelectedFarm(null);
    }
  }, [user, fetchFarms]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingFarmId(null);
    setFormData({
      farm_name: "",
      district: "bogura",
      latitude: 24.8465,
      longitude: 89.3773,
      area: 2.5,
      area_unit: "bigha",
      soil_type: "Alluvial Loam",
      current_crop: "Rice",
      planting_date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (farm) => {
    setEditingFarmId(farm.id);
    setFormData({
      farm_name: farm.farm_name,
      district: farm.district,
      latitude: farm.latitude,
      longitude: farm.longitude,
      area: farm.area || 0,
      area_unit: farm.area_unit || "bigha",
      soil_type: farm.soil_type || "Alluvial Loam",
      current_crop: farm.current_crop || "Rice",
      planting_date: farm.planting_date || "",
    });
    setIsModalOpen(true);
  };

  // District change in modal auto-updates suggested coords
  const handleDistrictChangeInForm = (dist) => {
    const coords = DISTRICT_COORDS[dist.toLowerCase()] || DISTRICT_COORDS.bogura;
    setFormData((prev) => ({
      ...prev,
      district: dist,
      latitude: coords.lat,
      longitude: coords.lon,
    }));
  };

  // Save farm (Create or Update)
  const handleSaveFarm = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFarmError(null);
    try {
      const payload = {
        farm_name: formData.farm_name,
        district: formData.district,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        area: formData.area ? parseFloat(formData.area) : null,
        area_unit: formData.area_unit,
        soil_type: formData.soil_type || null,
        current_crop: formData.current_crop || null,
        planting_date: formData.planting_date || null,
      };

      if (editingFarmId) {
        const updated = await api.updateFarm(editingFarmId, payload);
        setFarms((prev) => prev.map((f) => (f.id === editingFarmId ? updated : f)));
        if (selectedFarm?.id === editingFarmId) {
          setSelectedFarm(updated);
        }
        setFarmNotice(`Farm "${updated.farm_name}" updated successfully.`);
      } else {
        const created = await api.createFarm(payload);
        setFarms((prev) => [created, ...prev]);
        setSelectedFarm(created);
        setFarmNotice(`Farm "${created.farm_name}" created successfully.`);
      }
      setIsModalOpen(false);
      setTimeout(() => setFarmNotice(null), 4000);
    } catch (err) {
      setFarmError(err.message || "Failed to save farm.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete farm
  const handleDeleteFarm = async (farmId, farmName) => {
    if (!window.confirm(`Are you sure you want to delete "${farmName}"?`)) return;
    try {
      await api.deleteFarm(farmId);
      setFarms((prev) => prev.filter((f) => f.id !== farmId));
      if (selectedFarm?.id === farmId) {
        const remaining = farms.filter((f) => f.id !== farmId);
        setSelectedFarm(remaining.length > 0 ? remaining[0] : null);
      }
      setFarmNotice(`Farm "${farmName}" deleted.`);
      setTimeout(() => setFarmNotice(null), 4000);
    } catch (err) {
      setFarmError(err.message || "Failed to delete farm.");
    }
  };

  // Select farm and fetch its quick climate telemetry
  const handleSelectFarm = useCallback(async (farm) => {
    setSelectedFarm(farm);
    setLoadingClimate(true);
    setFarmClimate(null);
    try {
      const res = await api.getClimateSummary({
        lat: farm.latitude,
        lon: farm.longitude,
      });
      setFarmClimate(res.summary || {});
    } catch (err) {
      console.warn("Could not preview farm climate:", err);
    } finally {
      setLoadingClimate(false);
    }
  }, []);

  // When selectedFarm changes, load climate preview
  useEffect(() => {
    if (selectedFarm) {
      handleSelectFarm(selectedFarm);
    }
  }, [selectedFarm?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Execute: Run Climate Analysis in Dashboard
  const handleRunClimateAnalysis = () => {
    if (!selectedFarm) return;
    const payload = {
      district: selectedFarm.district,
      lat: selectedFarm.latitude,
      lon: selectedFarm.longitude,
      label: selectedFarm.farm_name,
    };

    window.dispatchEvent(
      new CustomEvent("agrishift:load-climate-location", {
        detail: payload,
      })
    );

    const el = document.getElementById("climate-dashboard");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Execute: Run Crop Recommendation
  const handleRunCropRecommendation = () => {
    if (!selectedFarm) return;
    const s = farmClimate || {};
    const payload = {
      locationName: `${selectedFarm.farm_name} (${selectedFarm.district})`,
      district: selectedFarm.district,
      temp_avg: s.avg_temperature != null ? s.avg_temperature : 28.5,
      precipitation: s.total_precipitation != null ? Math.round(s.total_precipitation / 14) : 10.0,
      humidity: s.avg_humidity != null ? s.avg_humidity : 82.0,
      soil_moisture:
        s.avg_soil_moisture != null
          ? s.avg_soil_moisture > 1
            ? s.avg_soil_moisture
            : s.avg_soil_moisture * 100
          : 70.0,
      solar_rad: s.avg_solar_radiation != null ? s.avg_solar_radiation : 15.5,
      wind_speed: s.avg_wind_speed != null ? s.avg_wind_speed : 1.5,
    };

    window.dispatchEvent(
      new CustomEvent("agrishift:load-crop-location", {
        detail: payload,
      })
    );

    const el = document.getElementById("crop-ranking");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="my-farm"
      className="relative py-24 px-4 sm:px-6 lg:px-12 bg-[#060b17] text-white border-t border-white/5 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 right-1/4 w-[600px] h-[500px] bg-gradient-to-bl from-emerald-600/10 via-cyan-600/10 to-transparent rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 left-10 w-[450px] h-[400px] bg-teal-600/8 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-sm shadow-emerald-500/10">
              <Tractor className="w-3.5 h-3.5 animate-pulse" />
              Agronomic Asset & Parcel Management
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              My Farm <span className="gradient-text">Portfolio</span>
            </h2>
            <p className="mt-2 text-gray-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              Manage your agricultural parcels, link satellite microclimate coordinates, and execute
              tailored NASA climate telemetry and crop suitability analysis with one click.
            </p>
          </div>

          {/* User state badge / Logout */}
          {user && (
            <div className="flex items-center gap-3 bg-slate-900/90 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono leading-tight">{user.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Global Alert Notices */}
        {farmNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-500/10 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {farmNotice}
          </div>
        )}

        {farmError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-red-500/10 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {farmError}
          </div>
        )}

        {/* Protected Section State: Render functional LoginCard when unauthenticated */}
        {!user && !authLoading && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-6 text-center max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
                <ShieldCheck className="w-4 h-4" />
                Protected Agronomic Dashboard
              </div>
              <h3 className="text-2xl font-bold text-white">Sign In to Access Your Farms</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
                Connect your farm GPS parcels with live NASA POWER observations and multi-crop recommendation models.
              </p>
            </div>

            <LoginCard onSuccess={fetchFarms} showDemoButton={true} className="mx-auto" />
          </div>
        )}

        {/* If Logged In: Portfolio Dashboard */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Farm Cards & Add button (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Saved Farm Parcels ({farms.length})
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Farm
                </button>
              </div>

              {farmsLoading && (
                <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-white/10">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Loading saved farms from database...</p>
                </div>
              )}

              {!farmsLoading && farms.length === 0 && (
                <div className="p-10 text-center bg-slate-900/60 rounded-3xl border border-white/10 space-y-3">
                  <Tractor className="w-10 h-10 text-gray-600 mx-auto" />
                  <h4 className="text-base font-bold text-white">No farms saved yet</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Add your agricultural parcel in Bogura, Rangpur, Dinajpur, Rajshahi, or Sylhet to
                    enable personalized NASA telemetry tracking.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Register First Farm
                  </button>
                </div>
              )}

              {/* Farm Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {farms.map((farm) => {
                  const isSelected = selectedFarm?.id === farm.id;
                  return (
                    <div
                      key={farm.id}
                      onClick={() => handleSelectFarm(farm)}
                      className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative ${
                        isSelected
                          ? "bg-slate-900/90 border-emerald-400 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-400/30"
                          : "bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80"
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                            {farm.district} Division
                          </div>
                          <h4 className="font-bold text-base text-white mt-0.5 leading-snug">
                            {farm.farm_name}
                          </h4>
                        </div>

                        {/* Edit / Delete actions */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(farm)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                            title="Edit Farm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFarm(farm.id, farm.farm_name)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete Farm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Coordinates */}
                      <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 mb-3">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        {farm.latitude.toFixed(4)}°N, {farm.longitude.toFixed(4)}°E
                      </div>

                      {/* Badges Bar */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-3 border-t border-white/8">
                        {farm.current_crop && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                            🌾 {farm.current_crop}
                          </span>
                        )}
                        {farm.area && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium">
                            📐 {farm.area} {farm.area_unit || "bigha"}
                          </span>
                        )}
                        {farm.soil_type && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium truncate max-w-[130px]">
                            🌱 {farm.soil_type}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Farm Execution & Intelligence Panel (5 cols) */}
            <div className="lg:col-span-5">
              {selectedFarm ? (
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-2xl shadow-black/40 space-y-6">
                  {/* Farm Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <Tractor className="w-3.5 h-3.5" />
                        Active Farm Parcel
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono font-bold">
                        ID #{selectedFarm.id}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {selectedFarm.farm_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-300 mt-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {selectedFarm.district.toUpperCase()} • {selectedFarm.latitude}°N,{" "}
                      {selectedFarm.longitude}°E
                    </div>
                  </div>

                  {/* Parcel Specs Table */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase">Parcel Area</span>
                      <div className="font-bold text-white mt-0.5">
                        {selectedFarm.area ? `${selectedFarm.area} ${selectedFarm.area_unit}` : "Not specified"}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase">Current Crop</span>
                      <div className="font-bold text-emerald-300 mt-0.5">
                        {selectedFarm.current_crop || "None listed"}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase">Soil Type</span>
                      <div className="font-bold text-amber-300 mt-0.5">
                        {selectedFarm.soil_type || "Alluvial Loam"}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase">Planting Date</span>
                      <div className="font-bold text-cyan-300 mt-0.5">
                        {selectedFarm.planting_date || "Seasonal"}
                      </div>
                    </div>
                  </div>

                  {/* Microclimate Telemetry Live Preview */}
                  <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-200 flex items-center gap-1.5">
                        <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                        Live NASA POWER Telemetry Preview
                      </span>
                      {loadingClimate && <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />}
                    </div>

                    {farmClimate && (
                      <div className="grid grid-cols-3 gap-2 text-center pt-2">
                        <div className="p-2 rounded-lg bg-white/5">
                          <div className="text-[10px] text-gray-400">Avg Temp</div>
                          <div className="text-sm font-bold text-amber-300 mt-0.5 font-mono">
                            {farmClimate.avg_temperature != null ? `${farmClimate.avg_temperature}°C` : "—"}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <div className="text-[10px] text-gray-400">Total Rain</div>
                          <div className="text-sm font-bold text-blue-300 mt-0.5 font-mono">
                            {farmClimate.total_precipitation != null ? `${farmClimate.total_precipitation} mm` : "—"}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <div className="text-[10px] text-gray-400">Soil Moisture</div>
                          <div className="text-sm font-bold text-emerald-300 mt-0.5 font-mono">
                            {farmClimate.avg_soil_moisture != null
                              ? `${(farmClimate.avg_soil_moisture > 1 ? farmClimate.avg_soil_moisture : farmClimate.avg_soil_moisture * 100).toFixed(1)}%`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Two Main Execution Buttons */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={handleRunClimateAnalysis}
                      className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                      Run Climate Analysis in Dashboard
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleRunCropRecommendation}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/8 hover:bg-white/14 border border-white/15 text-gray-200 hover:text-white font-semibold text-xs sm:text-sm transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Run Crop Recommendation for This Farm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-900/60 rounded-3xl border border-white/10 text-gray-400 text-xs">
                  Select a farm from the left to inspect its telemetry and run tailored analyses.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Create or Edit Farm */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/20 p-6 sm:p-8 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold mb-1">
                {editingFarmId ? "Edit Farm Parcel" : "Register New Farm"}
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Enter your farm attributes. These coordinates will be used for NASA POWER telemetry
                and crop suitability models.
              </p>

              <form onSubmit={handleSaveFarm} className="space-y-4 text-xs">
                {/* Farm Name */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Farm / Parcel Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.farm_name}
                    onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                    placeholder="e.g. Karatoya Basin Rice Field"
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* District Selection */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">District Location *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => handleDistrictChangeInForm(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="bogura">Bogura (Central Hub)</option>
                    <option value="rangpur">Rangpur (Tista Basin)</option>
                    <option value="dinajpur">Dinajpur (Piedmont Plains)</option>
                    <option value="rajshahi">Rajshahi (High Barind)</option>
                    <option value="sylhet">Sylhet (Surma Basin / Haor)</option>
                  </select>
                </div>

                {/* Coordinates (Latitude & Longitude) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Latitude (°N) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Longitude (°E) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Area & Unit */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-gray-300 font-medium mb-1">Area Size</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="e.g. 3.5"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Unit</label>
                    <select
                      value={formData.area_unit}
                      onChange={(e) => setFormData({ ...formData, area_unit: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      <option value="bigha">Bigha</option>
                      <option value="acre">Acre</option>
                      <option value="decimal">Decimal</option>
                      <option value="hectare">Hectare</option>
                    </select>
                  </div>
                </div>

                {/* Soil & Current Crop */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Soil Texture</label>
                    <select
                      value={formData.soil_type}
                      onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      {COMMON_SOILS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Current Crop</label>
                    <select
                      value={formData.current_crop}
                      onChange={(e) => setFormData({ ...formData, current_crop: e.target.value })}
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      {COMMON_CROPS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Planting Date */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Planting / Sowing Date</label>
                  <input
                    type="date"
                    value={formData.planting_date}
                    onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition shadow-md shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting
                      ? "Saving..."
                      : editingFarmId
                      ? "Update Farm"
                      : "Save Farm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
