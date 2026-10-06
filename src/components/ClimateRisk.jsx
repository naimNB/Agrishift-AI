import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CloudRain,
  Thermometer,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  Droplets,
  Sun,
  ShieldCheck,
  Info,
} from "lucide-react";
import { api } from "../services/api";

const DISTRICTS = [
  { id: "bogura", name: "Bogura", division: "Rajshahi", hub: "Central Agro Hub" },
  { id: "rangpur", name: "Rangpur", division: "Rangpur", hub: "Tista Basin" },
  { id: "dinajpur", name: "Dinajpur", division: "Rangpur", hub: "Northern Plains" },
  { id: "rajshahi", name: "Rajshahi", division: "Rajshahi", hub: "High Barind Tract" },
  { id: "sylhet", name: "Sylhet", division: "Sylhet", hub: "Surma Basin" },
];

function getLevelBadge(level) {
  switch (level?.toLowerCase()) {
    case "high":
      return {
        text: "High Risk",
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20 shadow-sm",
        dotClass: "bg-rose-400 animate-pulse",
        barClass: "from-rose-500 to-red-600",
        borderCard: "border-rose-500/40 bg-gradient-to-b from-rose-950/20 to-slate-900/90",
        actionClass: "bg-rose-950/40 border-rose-500/30 text-rose-200",
      };
    case "moderate":
      return {
        text: "Moderate Risk",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20 shadow-sm",
        dotClass: "bg-amber-400",
        barClass: "from-amber-400 to-yellow-500",
        borderCard: "border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-900/90",
        actionClass: "bg-amber-950/40 border-amber-500/30 text-amber-200",
      };
    case "low":
    default:
      return {
        text: "Low Risk",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20 shadow-sm",
        dotClass: "bg-emerald-400",
        barClass: "from-emerald-400 to-teal-500",
        borderCard: "border-emerald-500/30 bg-gradient-to-b from-emerald-950/15 to-slate-900/90",
        actionClass: "bg-emerald-950/30 border-emerald-500/30 text-emerald-200",
      };
  }
}

function getRiskCardIcon(riskType) {
  switch (riskType) {
    case "drought":
      return {
        Icon: Flame,
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/25",
      };
    case "flood":
      return {
        Icon: CloudRain,
        color: "text-sky-400",
        bg: "bg-sky-500/10 border-sky-500/25",
      };
    case "heat_stress":
    default:
      return {
        Icon: Thermometer,
        color: "text-orange-400",
        bg: "bg-orange-500/10 border-orange-500/25",
      };
  }
}

export default function ClimateRisk({
  selectedDistrict: externalDistrict = null,
  embedded = false,
}) {
  const [district, setDistrict] = useState(externalDistrict || "bogura");
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync with externalDistrict if passed from Unified Dashboard
  useEffect(() => {
    if (externalDistrict && externalDistrict !== district) {
      setDistrict(externalDistrict);
    }
  }, [externalDistrict]); // eslint-disable-line react-hooks/exhaustive-deps

  // Simulation controls toggle and state
  const [showSimControls, setShowSimControls] = useState(false);
  const [simSoilMoist, setSimSoilMoist] = useState("");
  const [simPeakRain, setSimPeakRain] = useState("");
  const [simTempMax, setSimTempMax] = useState("");

  const fetchRiskData = useCallback(async (isSimulation = false) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { district };
      if (isSimulation) {
        if (simSoilMoist !== "") payload.soil_moisture = parseFloat(simSoilMoist) / 100.0;
        if (simPeakRain !== "") payload.precipitation = parseFloat(simPeakRain);
        if (simTempMax !== "") payload.temp_max = parseFloat(simTempMax);
      }
      const data = await api.getClimateRisk(payload);
      setRiskData(data);
    } catch (err) {
      console.error("Failed to fetch climate risk:", err);
      setError(err.message || "Failed to load climate risk evaluation.");
    } finally {
      setLoading(false);
    }
  }, [district, simSoilMoist, simPeakRain, simTempMax]);

  useEffect(() => {
    fetchRiskData(showSimControls);
  }, [fetchRiskData, showSimControls]);

  const handleResetSimulation = () => {
    setSimSoilMoist("");
    setSimPeakRain("");
    setSimTempMax("");
    fetchRiskData(false);
  };

  const risks = riskData?.risks || [];
  const overallBadge = getLevelBadge(riskData?.overall_risk_level || "low");

  // Embedded view for the Unified Application Dashboard
  if (embedded) {
    return (
      <div
        id="climate-risk"
        className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl relative flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Climate Risk Intelligence
              </h3>
              <p className="text-[11px] text-gray-400 capitalize">
                NASA POWER Risk Analysis • {district}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${overallBadge.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${overallBadge.dotClass}`} />
            {overallBadge.text}
          </span>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-24 bg-white/5 rounded-2xl" />
            <div className="h-24 bg-white/5 rounded-2xl" />
            <div className="h-24 bg-white/5 rounded-2xl" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Risk Cards */}
        {!loading && risks.length > 0 && (
          <div className="space-y-3.5">
            {risks.map((risk) => {
              const badge = getLevelBadge(risk.level);
              const cardIcon = getRiskCardIcon(risk.risk_type);
              const IconComp = cardIcon.Icon;

              return (
                <div
                  key={risk.risk_type}
                  className={`p-4 rounded-2xl border transition-all ${badge.borderCard}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs ${cardIcon.bg}`}
                      >
                        <IconComp className={`w-4 h-4 ${cardIcon.color}`} />
                      </div>
                      <span className="font-bold text-sm text-white">{risk.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                    >
                      {badge.text}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                      <span>Hazard Score</span>
                      <span className="font-mono font-bold text-white">
                        {risk.score_percent}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${badge.barClass}`}
                        style={{ width: `${Math.max(6, Math.min(100, risk.score_percent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Explanation */}
                  <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed">
                    {risk.explanation}
                  </p>

                  {/* Recommended Action */}
                  <div className={`mt-2.5 p-2 rounded-xl border text-[11px] font-medium ${badge.actionClass}`}>
                    <span className="font-bold">Action: </span>
                    {risk.recommended_action}
                  </div>
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
      id="climate-risk"
      className="relative py-28 px-6 sm:px-10 lg:px-16 bg-[#060b17] text-white overflow-hidden border-t border-white/5"
    >
      {/* Background ambient blur */}
      <div
        className="absolute top-1/4 left-1/3 w-[650px] h-[450px] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-1/4 w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-sm shadow-rose-500/10">
              <ShieldAlert className="w-3.5 h-3.5" />
              Early Warning & Hazard Diagnostics
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              Climate Risk <span className="gradient-text">Intelligence</span>
            </h2>
            <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
              Real-time agroclimatic hazard evaluation across Bangladesh's agricultural belt.
              Analyzes NASA POWER daily telemetry using transparent physiological and hydrological thresholds.
            </p>
          </div>

          {/* Controls: District Selector & Simulation Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* District dropdown */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-md">
              <span className="text-xs text-gray-400 font-medium">District:</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-2"
              >
                {DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name} ({d.hub})
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => fetchRiskData(showSimControls)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
              title="Refresh telemetry assessment"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            {/* What-If Simulation Toggle */}
            <button
              type="button"
              onClick={() => setShowSimControls(!showSimControls)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                showSimControls
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {showSimControls ? "Hide Hazard Sliders" : "Simulate Climate Shocks"}
            </button>
          </div>
        </div>

        {/* Regional Status Summary Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-black/30 border border-white/8 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${overallBadge.dotClass}`} />
            <div>
              <span className="text-gray-400">Regional Hazard Status for {riskData?.display_name || "Region"}: </span>
              <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-[11px] ${overallBadge.badgeClass}`}>
                {overallBadge.text}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-400 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Engine: <strong className="text-white">Threshold Matrix</strong> (Bangladesh-oriented agronomic prototype rules)
            </span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Observation Window: {riskData?.assessment_period?.days_analyzed || 30} Days
            </span>
          </div>
        </div>

        {/* Optional What-If Hazard Simulation Panel */}
        {showSimControls && (
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 mb-8 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                Climate Hazard Stress-Testing Simulator
              </div>
              <button
                type="button"
                onClick={handleResetSimulation}
                className="text-xs text-amber-400 hover:underline cursor-pointer font-medium"
              >
                Reset to Live NASA Telemetry
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Soil Moisture */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Root-Zone Wetness Override
                  </span>
                  <span className="font-mono font-bold text-white">
                    {simSoilMoist !== "" ? `${simSoilMoist}%` : "Live Telemetry"}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={simSoilMoist !== "" ? simSoilMoist : 72}
                  onChange={(e) => setSimSoilMoist(e.target.value)}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>10% (Severe Drought)</span>
                  <span>100% (Saturated)</span>
                </div>
              </div>

              {/* Peak Rainfall */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    Daily Peak Rainfall Override
                  </span>
                  <span className="font-mono font-bold text-white">
                    {simPeakRain !== "" ? `${simPeakRain} mm` : "Live Telemetry"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="2"
                  value={simPeakRain !== "" ? simPeakRain : 18}
                  onChange={(e) => setSimPeakRain(e.target.value)}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>0 mm (Dry)</span>
                  <span>120 mm (Cloudburst)</span>
                </div>
              </div>

              {/* Max Temperature */}
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    Max Peak Temperature Override
                  </span>
                  <span className="font-mono font-bold text-white">
                    {simTempMax !== "" ? `${simTempMax}°C` : "Live Telemetry"}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="44"
                  step="0.5"
                  value={simTempMax !== "" ? simTempMax : 34}
                  onChange={(e) => setSimTempMax(e.target.value)}
                  className="w-full accent-orange-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>20°C (Cool)</span>
                  <span>44°C (Severe Heatwave)</span>
                </div>
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
              onClick={() => fetchRiskData(showSimControls)}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-200 text-xs font-semibold hover:bg-red-500/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 h-96" />
            ))}
          </div>
        )}

        {/* ── 3 RISK CARDS GRID ── */}
        {!loading && risks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {risks.map((risk) => {
              const badge = getLevelBadge(risk.level);
              const cardIcon = getRiskCardIcon(risk.risk_type);
              const IconComponent = cardIcon.Icon;

              return (
                <div
                  key={risk.risk_type}
                  className={`p-7 rounded-3xl glass-card border transition-all duration-300 flex flex-col justify-between shadow-xl ${badge.borderCard}`}
                >
                  <div>
                    {/* Top Row: Icon, Title & Level Badge */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${cardIcon.bg}`}
                        >
                          <IconComponent className={`w-6 h-6 ${cardIcon.color}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg leading-snug">
                            {risk.name}
                          </h3>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {risk.risk_type === "drought"
                              ? "Moisture Deficit & Evaporation"
                              : risk.risk_type === "flood"
                              ? "Waterlogging & Runoff Saturation"
                              : "Thermal Inversion & Humidex"}
                          </span>
                        </div>
                      </div>

                      {/* Level Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${badge.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                        {badge.text}
                      </span>
                    </div>

                    {/* Score Gauge / Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs text-gray-300 font-medium">Hazard Probability Score</span>
                        <span className="font-mono text-2xl font-black text-white">
                          {risk.score_percent}%
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${badge.barClass} transition-all duration-700`}
                          style={{ width: `${Math.max(6, Math.min(100, risk.score_percent))}%` }}
                        />
                      </div>
                    </div>

                    {/* Short Traceable Explanation */}
                    <div className="space-y-1.5 mb-6">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        Agroclimatic Diagnosis:
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        {risk.explanation}
                      </p>
                    </div>

                    {/* Contributing Variables Chips */}
                    {risk.contributing_variables && (
                      <div className="mb-6 pt-3 border-t border-white/8">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2 font-mono">
                          Observed Telemetry Factors:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(risk.contributing_variables).map(([key, val]) => (
                            <div
                              key={key}
                              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-gray-300 flex items-center gap-1.5"
                            >
                              <span className="text-gray-400 capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="font-bold text-white">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommended Action Card (Pinned at bottom) */}
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${badge.actionClass}`}>
                    <div className="flex items-center gap-2 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Recommended Agronomic Action:
                    </div>
                    <p>{risk.recommended_action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
