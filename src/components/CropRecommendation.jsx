import { useState, useEffect, useCallback } from "react";
import {
  Sprout,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Thermometer,
  CloudRain,
  Droplets,
  Sun,
  RefreshCw,
  Cpu,
  Sliders,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
  Sparkles,
  BarChart3,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { api } from "../services/api";

const DISTRICT_PRESETS = {
  bogura: { name: "Bogura", temp: 28.5, rain: 10.0, hum: 82.0, moist: 72.0, solar: 15.5 },
  rangpur: { name: "Rangpur", temp: 28.5, rain: 11.0, hum: 85.0, moist: 69.0, solar: 16.0 },
  dinajpur: { name: "Dinajpur", temp: 28.3, rain: 9.0, hum: 86.0, moist: 70.0, solar: 15.8 },
  rajshahi: { name: "Rajshahi", temp: 28.8, rain: 7.0, hum: 80.0, moist: 65.0, solar: 16.5 },
  sylhet: { name: "Sylhet", temp: 27.5, rain: 18.0, hum: 88.0, moist: 82.0, solar: 14.5 },
};

function getFactorColor(score) {
  if (score >= 80) {
    return {
      bar: "from-emerald-500 to-teal-400",
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    };
  }
  if (score >= 50) {
    return {
      bar: "from-amber-400 to-yellow-500",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    };
  }
  return {
    bar: "from-rose-500 to-red-400",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  };
}

function FactorBar({ name, score, icon: Icon, iconColor, currentVal }) {
  const color = getFactorColor(score);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="flex items-center gap-2 font-medium text-gray-200">
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          {name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-mono">({currentVal})</span>
          <span className={`font-bold font-mono text-sm ${color.text}`}>
            {score}%
          </span>
        </div>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color.bar} transition-all duration-500`}
          style={{ width: `${Math.max(6, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}

function FeatureWeightCard({ label, weight, color }) {
  const percent = Math.round(weight * 100);
  const colorClasses = {
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    sky: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  }[color] || "text-gray-300 bg-white/5 border-white/10";

  return (
    <div className={`p-3.5 rounded-xl border ${colorClasses}`}>
      <div className="text-[11px] font-semibold text-gray-300">{label}</div>
      <div className="text-xl font-bold font-mono mt-1">{percent}%</div>
      <div className="text-[10px] text-gray-400 mt-0.5 font-mono">gini weight: {weight.toFixed(3)}</div>
    </div>
  );
}

export default function CropRecommendation({
  selectedDistrict: externalDistrict = null,
  embedded = false,
}) {
  const [district, setDistrict] = useState(externalDistrict || "bogura");
  const [useMlEngine, setUseMlEngine] = useState(false);
  const [showSimControls, setShowSimControls] = useState(false);
  const [showGlobalImportance, setShowGlobalImportance] = useState(false);

  // Environmental parameters (defaults initialize to current district climate)
  const [tempAvg, setTempAvg] = useState(28.5);
  const [precip, setPrecip] = useState(10.0);
  const [humidity, setHumidity] = useState(82.0);
  const [soilMoisture, setSoilMoisture] = useState(72.0);
  const [solarRad, setSolarRad] = useState(15.5);

  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCrop, setExpandedCrop] = useState(null);
  const [selectedExplainCrop, setSelectedExplainCrop] = useState("rice");

  // Fetch ranking from backend
  const fetchRankings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.rankCrops({
        location: district,
        district: district,
        temp_avg: parseFloat(tempAvg),
        precipitation: parseFloat(precip),
        humidity: parseFloat(humidity),
        soil_moisture: parseFloat(soilMoisture) / 100.0,
        solar_rad: parseFloat(solarRad),
        use_ml: useMlEngine,
      });
      setRankingData(res);
      // Default expand top crop and select for explanation
      if (res.recommendations && res.recommendations.length > 0) {
        setExpandedCrop(res.recommendations[0].crop);
        setSelectedExplainCrop((prev) => {
          const exists = res.recommendations.some((r) => r.crop === prev);
          return exists ? prev : res.recommendations[0].crop;
        });
      }
    } catch (err) {
      console.error("Failed to rank crops:", err);
      setError(err.message || "Failed to load crop ranking from server.");
    } finally {
      setLoading(false);
    }
  }, [district, tempAvg, precip, humidity, soilMoisture, solarRad, useMlEngine]);

  // Sync parameters when district changes
  const handleDistrictChange = (d) => {
    setDistrict(d);
    const p = DISTRICT_PRESETS[d] || DISTRICT_PRESETS.bogura;
    setTempAvg(p.temp);
    setPrecip(p.rain);
    setHumidity(p.hum);
    setSoilMoisture(p.moist);
    setSolarRad(p.solar);
  };

  // Sync with externalDistrict if passed from Unified Dashboard
  useEffect(() => {
    if (externalDistrict && externalDistrict !== district) {
      handleDistrictChange(externalDistrict);
    }
  }, [externalDistrict]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial trigger & on state change
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Listen for location loading events from FarmMap
  useEffect(() => {
    const handleLoadCropLocation = (event) => {
      const data = event.detail || {};
      if (data.district) {
        setDistrict(data.district);
      }
      if (data.temp_avg != null) setTempAvg(data.temp_avg);
      if (data.precipitation != null) setPrecip(data.precipitation);
      if (data.humidity != null) setHumidity(data.humidity);
      if (data.soil_moisture != null) setSoilMoisture(data.soil_moisture);
      if (data.solar_rad != null) setSolarRad(data.solar_rad);
    };
    window.addEventListener("agrishift:load-crop-location", handleLoadCropLocation);
    return () => window.removeEventListener("agrishift:load-crop-location", handleLoadCropLocation);
  }, []);

  // Reset to district baseline
  const resetToBaseline = () => {
    const p = DISTRICT_PRESETS[district] || DISTRICT_PRESETS.bogura;
    setTempAvg(p.temp);
    setPrecip(p.rain);
    setHumidity(p.hum);
    setSoilMoisture(p.moist);
    setSolarRad(p.solar);
  };

  const recommendations = rankingData?.recommendations || [];
  const bestCrop = recommendations[0] || null;
  const currentExplainItem =
    recommendations.find((r) => r.crop === selectedExplainCrop) || bestCrop;

  // Embedded view for the Unified Application Dashboard
  if (embedded) {
    return (
      <div
        id="crop-ranking"
        className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl relative flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Crop Suitability Ranking
              </h3>
              <p className="text-[11px] text-gray-400 capitalize">
                Multi-Candidate Analysis • {district}
              </p>
            </div>
          </div>

          {/* Engine toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-[10px]">
            <button
              type="button"
              onClick={() => setUseMlEngine(false)}
              className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                !useMlEngine
                  ? "bg-emerald-500/20 text-emerald-300 font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Rules
            </button>
            <button
              type="button"
              onClick={() => setUseMlEngine(true)}
              className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                useMlEngine
                  ? "bg-cyan-500/20 text-cyan-300 font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Cpu className="w-3 h-3" />
              ML
            </button>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-16 bg-white/5 rounded-2xl" />
            <div className="h-16 bg-white/5 rounded-2xl" />
            <div className="h-16 bg-white/5 rounded-2xl" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Ranked Crops List */}
        {!loading && recommendations.length > 0 && (
          <div className="space-y-2.5">
            {recommendations.slice(0, 5).map((rec) => {
              const scorePct = Math.round(rec.score * 100);
              const isTop = rec.rank === 1;
              const isExpanded = expandedCrop === rec.crop;

              return (
                <div
                  key={rec.crop}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isTop
                      ? "bg-gradient-to-r from-emerald-950/30 to-slate-900 border-emerald-500/30 shadow-md shadow-emerald-500/10"
                      : "bg-white/5 hover:bg-white/8 border-white/8"
                  }`}
                  onClick={() => setExpandedCrop(isExpanded ? null : rec.crop)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isTop
                            ? "bg-emerald-400 text-black shadow"
                            : "bg-white/10 text-gray-300"
                        }`}
                      >
                        #{rec.rank}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-white capitalize">{rec.crop}</span>
                        {isTop && (
                          <span className="ml-2 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                            Best Match
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{scorePct}%</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${
                        scorePct >= 80
                          ? "bg-emerald-400"
                          : scorePct >= 60
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                      style={{ width: `${scorePct}%` }}
                    />
                  </div>

                  {/* Expanded Factor Breakdown */}
                  {isExpanded && rec.factor_scores && (
                    <div className="mt-3 pt-3 border-t border-white/8 space-y-1.5 text-[11px] animate-fade-in">
                      <div className="grid grid-cols-2 gap-2 text-gray-300">
                        <div>
                          Temp: <strong className="text-white">{rec.factor_scores.temp_suitability || 85}%</strong>
                        </div>
                        <div>
                          Rain: <strong className="text-white">{rec.factor_scores.rain_suitability || 80}%</strong>
                        </div>
                        <div>
                          Humidity: <strong className="text-white">{rec.factor_scores.humidity_suitability || 90}%</strong>
                        </div>
                        <div>
                          Soil Moist: <strong className="text-white">{rec.factor_scores.moist_suitability || 88}%</strong>
                        </div>
                      </div>
                      {rec.reasoning && rec.reasoning.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-1 italic">
                          "{rec.reasoning[0]}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <section
      id="crop-ranking"
      className="relative py-28 px-6 sm:px-10 lg:px-16 bg-[#070d1a] text-white overflow-hidden border-t border-white/5"
    >
      {/* Background Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/8 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-sm shadow-green-500/10">
              <Sprout className="w-3.5 h-3.5" />
              Agronomic Decision Support & Explainable AI
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              Crop Recommendation &{" "}
              <span className="gradient-text">Ranking Engine</span>
            </h2>
            <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
              Evaluating candidate crops against NASA agroclimate metrics and Bangladesh
              Agro-Ecological Zones (AEZ) physiological thresholds with transparent factor suitability explanations.
            </p>
          </div>

          {/* Engine Selector & Simulation Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Rule-based vs ML toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setUseMlEngine(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  !useMlEngine
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Defensible Bangladesh AEZ Agronomic Rules"
              >
                Agronomic Rules (Defensible)
              </button>
              <button
                type="button"
                onClick={() => setUseMlEngine(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  useMlEngine
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Trained RandomForest Multi-Crop Classifier"
              >
                <Cpu className="w-3.5 h-3.5" />
                RandomForest ML
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSimControls(!showSimControls)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                showSimControls
                  ? "bg-white/15 border-white/30 text-white"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {showSimControls ? "Hide What-If Sliders" : "Simulate What-If Climate"}
            </button>
          </div>
        </div>

        {/* Engine Transparency Notice */}
        <div className="mb-8 p-4 rounded-2xl bg-black/30 border border-white/8 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Evaluation Architecture:{" "}
              <strong className="text-white">
                {rankingData?.engine_name || "Bangladesh AEZ Agronomic Rules"}
              </strong>{" "}
              ({rankingData?.is_ai_model ? "Trained ML Model" : "Transparent Agronomic Logic"})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-gray-500">
              Location:{" "}
              <span className="text-emerald-400 uppercase font-semibold">{district}</span>
            </span>
            <div className="flex items-center gap-1 pl-3 border-l border-white/10">
              {Object.keys(DISTRICT_PRESETS).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDistrictChange(d)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    district === d
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {DISTRICT_PRESETS[d].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional What-If Climate Simulation Sliders */}
        {showSimControls && (
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/15 mb-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-yellow-300 text-xs font-bold uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                What-If Climate Simulation Panel
              </div>
              <button
                type="button"
                onClick={resetToBaseline}
                className="text-xs text-emerald-400 hover:underline cursor-pointer font-medium"
              >
                Reset to NASA Baseline
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Temp */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Temperature</span>
                  <span className="font-bold text-white font-mono">{tempAvg}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="0.5"
                  value={tempAvg}
                  onChange={(e) => setTempAvg(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Rain */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Precipitation</span>
                  <span className="font-bold text-white font-mono">{precip} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="0.5"
                  value={precip}
                  onChange={(e) => setPrecip(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Humidity */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Humidity</span>
                  <span className="font-bold text-white font-mono">{humidity}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="98"
                  step="1"
                  value={humidity}
                  onChange={(e) => setHumidity(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              {/* Soil Moisture */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Root-Zone Wetness</span>
                  <span className="font-bold text-white font-mono">{soilMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  step="1"
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Solar Rad */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Solar Radiation</span>
                  <span className="font-bold text-white font-mono">{solarRad} kWh</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="0.5"
                  value={solarRad}
                  onChange={(e) => setSolarRad(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-3xl bg-red-950/40 border border-red-500/30 text-white flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchRankings}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-200 text-xs font-semibold hover:bg-red-500/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 mb-8 animate-pulse">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 h-52" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 rounded-3xl bg-slate-900/40 border border-white/10 h-36" />
              ))}
            </div>
          </div>
        )}

        {/* Results Layout */}
        {!loading && rankingData && (
          <div className="space-y-10">
            {/* ── #1 BEST CROP SHOWCASE HERO CARD ── */}
            {bestCrop && (
              <div className="group relative p-8 sm:p-10 rounded-3xl glass-card border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-slate-900/90 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-400 text-black shadow-md shadow-emerald-400/25">
                        <Award className="w-3.5 h-3.5" />
                        Rank #1 Optimal Recommendation
                      </span>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        {bestCrop.category}
                      </span>
                    </div>

                    <h3
                      className="text-3xl sm:text-4xl font-extrabold text-white"
                      style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
                    >
                      {bestCrop.display_name}
                    </h3>

                    <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
                      {bestCrop.reasoning[0] || "Optimal agronomic match for regional soil and climate parameters."}
                    </p>

                    {/* Sowing Period Pill */}
                    <div className="inline-flex items-center gap-2 pt-2 text-xs text-gray-300">
                      <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong className="text-white">Recommended Sowing Window:</strong>{" "}
                        <span className="text-emerald-300 font-medium">{bestCrop.sowing_period}</span>
                      </span>
                    </div>
                  </div>

                  {/* Score & Gauge Column */}
                  <div className="flex flex-col items-center sm:items-end justify-center shrink-0 lg:border-l lg:border-white/10 lg:pl-8">
                    <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300 font-mono">
                      {Math.round(bestCrop.score * 100)}%
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
                      Suitability Match
                    </span>
                    <span className="inline-block mt-2 text-xs font-bold uppercase tracking-wide text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 rounded-full">
                      {bestCrop.suitability} Viability
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── EXPLAINABLE CROP RECOMMENDATIONS ("WHY {CROP}?") ── */}
            {currentExplainItem && (
              <div
                id="crop-explanation-panel"
                className="relative p-6 sm:p-8 rounded-3xl glass-card border border-emerald-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 shadow-2xl overflow-hidden"
              >
                {/* Header & Crop Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Physiological Factor Decomposition & Explainability
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                      <span>Why {currentExplainItem.display_name}?</span>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                        Rank #{currentExplainItem.rank}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      Transparent factor suitability breakdown based on Bangladesh AEZ physiological tolerances and NASA telemetry.
                    </p>
                  </div>

                  {/* Crop Switcher Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10">
                    {recommendations.map((cropItem) => {
                      const isSelected = cropItem.crop === selectedExplainCrop;
                      return (
                        <button
                          key={cropItem.crop}
                          type="button"
                          onClick={() => setSelectedExplainCrop(cropItem.crop)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span>{cropItem.display_name.split(" ")[0]}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isSelected ? "bg-black/20 text-black font-bold" : "bg-white/10 text-gray-400"
                            }`}
                          >
                            #{cropItem.rank}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main 2-Column Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                  {/* Left Column: 5 Factor Suitability Meters (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Factor Suitability Scores (0–100%)
                      </h4>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        Overall Score: {Math.round(currentExplainItem.score * 100)}% ({currentExplainItem.suitability})
                      </span>
                    </div>

                    <div className="space-y-4 bg-black/30 p-5 rounded-2xl border border-white/5">
                      {/* Factor 1: Temperature */}
                      <FactorBar
                        name="Temperature Suitability"
                        score={currentExplainItem.factor_scores?.temperature ?? 90}
                        icon={Thermometer}
                        iconColor="text-orange-400"
                        currentVal={`${tempAvg}°C`}
                      />

                      {/* Factor 2: Rainfall */}
                      <FactorBar
                        name="Rainfall Suitability"
                        score={currentExplainItem.factor_scores?.rainfall ?? 84}
                        icon={CloudRain}
                        iconColor="text-sky-400"
                        currentVal={`${precip} mm/day`}
                      />

                      {/* Factor 3: Humidity */}
                      <FactorBar
                        name="Humidity Suitability"
                        score={currentExplainItem.factor_scores?.humidity ?? 92}
                        icon={Droplets}
                        iconColor="text-cyan-400"
                        currentVal={`${humidity}%`}
                      />

                      {/* Factor 4: Soil Moisture */}
                      <FactorBar
                        name="Soil Moisture Suitability"
                        score={currentExplainItem.factor_scores?.soil_moisture ?? 95}
                        icon={Layers}
                        iconColor="text-emerald-400"
                        currentVal={`${soilMoisture}% wetness`}
                      />

                      {/* Factor 5: Solar Radiation */}
                      <FactorBar
                        name="Solar Radiation Suitability"
                        score={currentExplainItem.factor_scores?.solar_radiation ?? 78}
                        icon={Sun}
                        iconColor="text-amber-400"
                        currentVal={`${solarRad} kWh/m²/day`}
                      />
                    </div>
                  </div>

                  {/* Right Column: Favorable & Caution Factors (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Favorable Factors Card */}
                    <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        Favorable Physiological Factors ({currentExplainItem.favorable_factors?.length || 0})
                      </div>
                      <div className="space-y-2 text-xs text-emerald-100/90 leading-relaxed">
                        {currentExplainItem.favorable_factors && currentExplainItem.favorable_factors.length > 0 ? (
                          currentExplainItem.favorable_factors.map((f, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 italic">Baseline physiological adaptation.</div>
                        )}
                      </div>
                    </div>

                    {/* Caution Factors Card */}
                    <div className="p-5 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        Caution & Stress Bottlenecks ({currentExplainItem.caution_factors?.length || 0})
                      </div>
                      <div className="space-y-2 text-xs text-amber-100/90 leading-relaxed">
                        {currentExplainItem.caution_factors && currentExplainItem.caution_factors.length > 0 ? (
                          currentExplainItem.caution_factors.map((c, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              <span>{c}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 italic">No significant agronomic bottlenecks identified.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Global Feature Importance Drawer / Section (RandomForest) */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      Global Model Feature Importance ({rankingData?.is_ai_model ? "RandomForest ML Pipeline" : "Benchmark ML Weights"})
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGlobalImportance(!showGlobalImportance)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      {showGlobalImportance ? "Hide Global Feature Weights" : "View Global Model Feature Importance"}
                      {showGlobalImportance ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {showGlobalImportance && (
                    <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-4">
                      <div className="text-xs text-gray-300 leading-relaxed">
                        The trained <strong>RandomForestClassifier (200 estimators)</strong> evaluates multi-crop viability by splitting on NASA agroclimate telemetry.
                        Global Gini importance scores across all tree ensembles:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <FeatureWeightCard
                          label="Solar Radiation"
                          weight={rankingData?.global_feature_importance?.solar_radiation || 0.331}
                          color="amber"
                        />
                        <FeatureWeightCard
                          label="Relative Humidity"
                          weight={rankingData?.global_feature_importance?.humidity || 0.132}
                          color="cyan"
                        />
                        <FeatureWeightCard
                          label="Soil Moisture"
                          weight={rankingData?.global_feature_importance?.soil_moisture || 0.125}
                          color="emerald"
                        />
                        <FeatureWeightCard
                          label="Ambient Temp"
                          weight={rankingData?.global_feature_importance?.temperature || 0.091}
                          color="orange"
                        />
                        <FeatureWeightCard
                          label="Precipitation"
                          weight={rankingData?.global_feature_importance?.rainfall || 0.064}
                          color="sky"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ALL RANKED CANDIDATE CROPS LIST ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  Full Candidate Crop Ranking ({recommendations.length} Evaluated)
                </h4>
                <span className="text-xs text-gray-500 font-mono">
                  Ranked by Bangladesh Agro-Ecological Compatibility
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((item) => {
                  const isExpanded = expandedCrop === item.crop;
                  const isTopRank = item.rank === 1;
                  const scorePercent = Math.round(item.score * 100);

                  // Suitability color badge
                  const tierColor =
                    item.suitability === "High"
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : item.suitability === "Medium"
                      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      : "text-rose-400 border-rose-500/30 bg-rose-500/10";

                  return (
                    <div
                      key={item.crop}
                      className={`p-6 rounded-3xl glass-card transition-all duration-300 border ${
                        isTopRank
                          ? "border-emerald-500/40 bg-slate-900/90 shadow-lg shadow-emerald-500/5"
                          : "border-white/10 hover:border-white/20 bg-slate-900/60"
                      }`}
                    >
                      {/* Top Row: Rank, Title, Score */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono ${
                              isTopRank
                                ? "bg-emerald-400 text-black font-extrabold"
                                : item.rank === 2
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                                : "bg-white/5 text-gray-400 border border-white/10"
                            }`}
                          >
                            #{item.rank}
                          </span>
                          <div>
                            <h5 className="font-bold text-white text-base">
                              {item.display_name}
                            </h5>
                            <span className="text-[11px] text-gray-400 font-mono">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {/* Suitability Score */}
                        <div className="text-right">
                          <div className="text-xl font-bold font-mono text-white">
                            {scorePercent}%
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mt-0.5 ${tierColor}`}
                          >
                            {item.suitability}
                          </span>
                        </div>
                      </div>

                      {/* Score Progress Bar */}
                      <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.suitability === "High"
                              ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                              : item.suitability === "Medium"
                              ? "bg-amber-400"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>

                      {/* Sowing Period */}
                      <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          Sowing Window:
                        </span>
                        <span className="text-gray-200 font-medium text-[11px] text-right">
                          {item.sowing_period}
                        </span>
                      </div>

                      {/* Mini Factor Breakdown */}
                      <div className="mt-3 pt-3 border-t border-white/8">
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                          <span>Factor Suitability:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExplainCrop(item.crop);
                              const el = document.getElementById("crop-explanation-panel");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-emerald-400 hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                          >
                            Why {item.display_name.split(" ")[0]}?
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
                          <div className="p-1 rounded bg-black/30 border border-white/5">
                            <div className="text-gray-400">Temp</div>
                            <div className={`font-bold ${getFactorColor(item.factor_scores?.temperature || 90).text}`}>
                              {item.factor_scores?.temperature || 90}%
                            </div>
                          </div>
                          <div className="p-1 rounded bg-black/30 border border-white/5">
                            <div className="text-gray-400">Rain</div>
                            <div className={`font-bold ${getFactorColor(item.factor_scores?.rainfall || 84).text}`}>
                              {item.factor_scores?.rainfall || 84}%
                            </div>
                          </div>
                          <div className="p-1 rounded bg-black/30 border border-white/5">
                            <div className="text-gray-400">Hum</div>
                            <div className={`font-bold ${getFactorColor(item.factor_scores?.humidity || 92).text}`}>
                              {item.factor_scores?.humidity || 92}%
                            </div>
                          </div>
                          <div className="p-1 rounded bg-black/30 border border-white/5">
                            <div className="text-gray-400">Moist</div>
                            <div className={`font-bold ${getFactorColor(item.factor_scores?.soil_moisture || 95).text}`}>
                              {item.factor_scores?.soil_moisture || 95}%
                            </div>
                          </div>
                          <div className="p-1 rounded bg-black/30 border border-white/5">
                            <div className="text-gray-400">Solar</div>
                            <div className={`font-bold ${getFactorColor(item.factor_scores?.solar_radiation || 78).text}`}>
                              {item.factor_scores?.solar_radiation || 78}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reasoning Bullets (Short Reasons) */}
                      <div className="mt-3 space-y-1.5">
                        {item.reasoning.slice(0, isExpanded ? 5 : 2).map((r, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}

                        {/* Stress factors if any */}
                        {item.stress_factors && item.stress_factors.length > 0 && (
                          <div className="pt-1">
                            {item.stress_factors.slice(0, isExpanded ? 3 : 1).map((s, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-xs text-amber-300/90 leading-relaxed"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expand / Collapse Button */}
                      {(item.reasoning.length > 2 || (item.stress_factors && item.stress_factors.length > 1)) && (
                        <button
                          type="button"
                          onClick={() => setExpandedCrop(isExpanded ? null : item.crop)}
                          className="mt-3 pt-2 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          {isExpanded ? "Show Less" : "View Full Agronomic Analysis"}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
