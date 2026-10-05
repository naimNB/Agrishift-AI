import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Thermometer,
  CloudRain,
  Droplets,
  Layers,
  SunMedium,
  LayoutGrid,
  Maximize2,
  Calendar,
  AlertTriangle,
} from "lucide-react";

/**
 * Format "YYYY-MM-DD" into a concise "MMM D" label (e.g. "Sep 18")
 */
function formatShortDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${monthNames[monthIndex] || parts[1]} ${day}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Safe numeric cleaner: eliminates null, undefined, -999, and -999.0
 */
function safeNum(val) {
  if (val === null || val === undefined || val === -999 || val === -999.0) {
    return null;
  }
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/**
 * Custom dark glassmorphism Tooltip
 */
function CustomTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-2xl bg-[#070d1a]/95 border border-white/20 p-3.5 shadow-2xl backdrop-blur-xl min-w-[170px] z-50">
      <div className="text-[11px] font-mono text-gray-400 border-b border-white/10 pb-1.5 mb-2 flex items-center justify-between">
        <span>{formatShortDate(label)}</span>
        <span className="text-[10px] text-gray-400">{label}</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-4 text-xs font-medium"
            >
              <span className="flex items-center gap-1.5 text-gray-300">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {entry.value}{" "}
                <span className="text-[10px] text-gray-400 font-normal">
                  {entry.unit || unit}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HistoricalClimateTrends({
  dailyRecords = [],
  districtName = "Bogura",
  loading = false,
}) {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'temperature' | 'precipitation' | 'moisture' | 'humidity' | 'solar'

  // Pre-process daily records with strict safety rules:
  // - clean -999 and nulls
  // - convert soil moisture (0-1 fraction) to percentage (0-100%)
  // - compute formatted date for display
  const chartData = useMemo(() => {
    if (!dailyRecords || !dailyRecords.length) return [];

    return dailyRecords.map((r) => {
      const soilRaw = safeNum(r.soil_moisture);
      const soilPercent =
        soilRaw !== null
          ? soilRaw > 1
            ? Math.round(soilRaw * 10) / 10
            : Math.round(soilRaw * 1000) / 10
          : null;

      return {
        date: r.date,
        shortDate: formatShortDate(r.date),
        temp_avg: safeNum(r.temp_avg),
        temp_max: safeNum(r.temp_max),
        temp_min: safeNum(r.temp_min),
        precipitation: safeNum(r.precipitation),
        humidity: safeNum(r.humidity),
        solar_rad: safeNum(r.solar_rad),
        wind_speed: safeNum(r.wind_speed),
        soil_moisture: soilPercent,
      };
    });
  }, [dailyRecords]);

  // Derived statistics for trend summary pills
  const stats = useMemo(() => {
    if (!chartData.length) return {};

    const validTemps = chartData.map((d) => d.temp_avg).filter((v) => v !== null);
    const validRains = chartData.map((d) => d.precipitation).filter((v) => v !== null);
    const validMoist = chartData.map((d) => d.soil_moisture).filter((v) => v !== null);
    const validHums = chartData.map((d) => d.humidity).filter((v) => v !== null);
    const validSolars = chartData.map((d) => d.solar_rad).filter((v) => v !== null);

    const rainyDays = validRains.filter((r) => r > 0.5).length;
    const maxRain = validRains.length ? Math.max(...validRains) : 0;
    const peakTemp = validTemps.length ? Math.max(...validTemps) : 0;
    const lowTemp = validTemps.length ? Math.min(...validTemps) : 0;

    return {
      rainyDays,
      maxRain,
      peakTemp,
      lowTemp,
      hasData: chartData.length > 0,
      count: chartData.length,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl mb-8 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="w-56 h-6 rounded-lg bg-white/10" />
          <div className="w-40 h-8 rounded-xl bg-white/10" />
        </div>
        <div className="w-full h-80 rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/10 text-center mb-8">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
        <h4 className="text-base font-bold text-gray-200">
          No Historical Climate Observations Available
        </h4>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          No daily records were returned for {districtName} in this date window. Please select another observation period or district.
        </p>
      </div>
    );
  }

  // TABS CONFIGURATION
  const tabs = [
    { id: "all", label: "Overview Grid", icon: LayoutGrid },
    { id: "temperature", label: "Temperature", icon: Thermometer, unit: "°C", color: "text-cyan-400" },
    { id: "precipitation", label: "Precipitation", icon: CloudRain, unit: "mm", color: "text-sky-400" },
    { id: "moisture", label: "Soil Moisture", icon: Layers, unit: "%", color: "text-emerald-400" },
    { id: "humidity", label: "Humidity", icon: Droplets, unit: "%", color: "text-teal-400" },
    { id: "solar", label: "Solar Radiation", icon: SunMedium, unit: "kWh/m²", color: "text-amber-400" },
  ];

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            NASA Historical Observation Telemetry
          </div>
          <h3
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
          >
            Historical Climate <span className="gradient-text">Trends & Fluctuations</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Timeseries data for <strong className="text-white">{districtName}</strong> across {stats.count} observation days.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md self-start sm:self-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-sm shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DETAIL VIEW (SINGLE TAB) ── */}
      {activeTab !== "all" && (
        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/15 shadow-2xl relative overflow-hidden">
          {/* Subtle glow header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Parameter Focus
              </span>
              <h4 className="text-xl font-bold text-white mt-0.5">
                {tabs.find((t) => t.id === activeTab)?.label}{" "}
                <span className="text-xs font-mono text-gray-400 font-normal">
                  ({tabs.find((t) => t.id === activeTab)?.unit})
                </span>
              </h4>
            </div>

            {/* Quick Context Stat */}
            <div className="flex items-center gap-3 text-xs font-mono text-gray-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {chartData[0]?.date} → {chartData[chartData.length - 1]?.date}
              </span>
            </div>
          </div>

          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "temperature" && (
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTempAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} unit="°C" domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip content={<CustomTooltip unit="°C" />} />
                  <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="temp_max"
                    name="Max Temp"
                    stroke="#fb923c"
                    strokeWidth={2}
                    fillOpacity={0}
                    dot={false}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="temp_avg"
                    name="Avg Temp"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fill="url(#colorTempAvg)"
                    dot={{ r: 2, fill: "#22d3ee" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="temp_min"
                    name="Min Temp"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fillOpacity={0}
                    dot={false}
                    connectNulls
                  />
                </AreaChart>
              )}

              {activeTab === "precipitation" && (
                <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} unit="mm" domain={[0, "auto"]} />
                  <Tooltip content={<CustomTooltip unit="mm" />} />
                  <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }} />
                  <Bar
                    dataKey="precipitation"
                    name="Daily Rainfall"
                    fill="#38bdf8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              )}

              {activeTab === "moisture" && (
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMoist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }} />
                  <ReferenceLine y={50} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: "AWD Safe Threshold (50%)", fill: "#38bdf8", fontSize: 10 }} />
                  <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Moisture Stress (25%)", fill: "#ef4444", fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="soil_moisture"
                    name="Root-Zone Wetness"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#colorMoist)"
                    dot={{ r: 2.5, fill: "#10b981" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </AreaChart>
              )}

              {activeTab === "humidity" && (
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }} />
                  <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "High Blast / Fungal Risk (80%+)", fill: "#f59e0b", fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    name="Relative Humidity"
                    stroke="#2dd4bf"
                    strokeWidth={2.5}
                    fill="url(#colorHum)"
                    dot={{ r: 2, fill: "#2dd4bf" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </AreaChart>
              )}

              {activeTab === "solar" && (
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} unit=" kWh" domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip unit="kWh/m²/day" />} />
                  <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="solar_rad"
                    name="Surface Solar Radiation"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="url(#colorSolar)"
                    dot={{ r: 2, fill: "#f59e0b" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── OVERVIEW GRID VIEW (ALL 5 CHARTS IN CLEAN 2-COLUMN CARDS) ── */}
      {activeTab === "all" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Temperature */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Thermometer className="w-4 h-4" />
                <h4 className="text-sm font-bold text-white">Daily Temperature Trends</h4>
              </div>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                °C (T2M)
              </span>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gridTempAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip content={<CustomTooltip unit="°C" />} />
                  <Area type="monotone" dataKey="temp_max" name="Max Temp" stroke="#fb923c" strokeWidth={1.5} dot={false} fillOpacity={0} connectNulls />
                  <Area type="monotone" dataKey="temp_avg" name="Avg Temp" stroke="#22d3ee" strokeWidth={2} fill="url(#gridTempAvg)" dot={false} connectNulls />
                  <Area type="monotone" dataKey="temp_min" name="Min Temp" stroke="#60a5fa" strokeWidth={1.5} dot={false} fillOpacity={0} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Precipitation */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sky-400">
                <CloudRain className="w-4 h-4" />
                <h4 className="text-sm font-bold text-white">Daily Precipitation</h4>
              </div>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                mm (PRECTOTCORR)
              </span>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={[0, "auto"]} />
                  <Tooltip content={<CustomTooltip unit="mm" />} />
                  <Bar dataKey="precipitation" name="Rainfall" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Soil Moisture / Wetness */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Layers className="w-4 h-4" />
                <h4 className="text-sm font-bold text-white">Root-Zone Soil Wetness</h4>
              </div>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                % Saturation (GWETROOT)
              </span>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gridMoist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Area type="monotone" dataKey="soil_moisture" name="Soil Wetness" stroke="#10b981" strokeWidth={2} fill="url(#gridMoist)" dot={false} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Humidity */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-teal-400">
                <Droplets className="w-4 h-4" />
                <h4 className="text-sm font-bold text-white">Relative Humidity</h4>
              </div>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                % (RH2M)
              </span>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gridHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Area type="monotone" dataKey="humidity" name="Humidity" stroke="#2dd4bf" strokeWidth={2} fill="url(#gridHum)" dot={false} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Solar Radiation (Span 2 on large screens or full width) */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl glass-card border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <SunMedium className="w-4 h-4" />
                <h4 className="text-sm font-bold text-white">All-Sky Surface Solar Radiation</h4>
              </div>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                kWh/m²/day (ALLSKY_SFC_SW_DWN)
              </span>
            </div>
            <div className="w-full h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gridSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip unit="kWh/m²/day" />} />
                  <Area type="monotone" dataKey="solar_rad" name="Solar Radiation" stroke="#f59e0b" strokeWidth={2} fill="url(#gridSolar)" dot={false} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
