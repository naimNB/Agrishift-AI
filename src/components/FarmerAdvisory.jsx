import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  Droplets,
  Sprout,
  Thermometer,
  CloudRain,
  Calendar,
  RefreshCw,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Info,
} from "lucide-react";
import { api } from "../services/api";

const DISTRICTS = [
  { id: "bogura", name: "Bogura", nameBn: "বগুড়া", hub: "Central Agro Hub" },
  { id: "rangpur", name: "Rangpur", nameBn: "রংপুর", hub: "Tista Basin" },
  { id: "dinajpur", name: "Dinajpur", nameBn: "দিনাজপুর", hub: "Northern Plains" },
  { id: "rajshahi", name: "Rajshahi", nameBn: "রাজশাহী", hub: "High Barind Tract" },
  { id: "sylhet", name: "Sylhet", nameBn: "সিলেট", hub: "Surma Basin" },
];

function getPriorityBadge(priority, lang = "en") {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return {
        label: lang === "bn" ? "জরুরি পদক্ষেপ" : "Urgent Action",
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10",
        dotClass: "bg-rose-400 animate-ping",
        cardBorder: "border-rose-500/40 bg-gradient-to-br from-rose-950/25 via-slate-900/80 to-slate-900/90",
      };
    case "actionable":
      return {
        label: lang === "bn" ? "সক্রিয় পরামর্শ" : "Actionable",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10",
        dotClass: "bg-amber-400",
        cardBorder: "border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/80 to-slate-900/90",
      };
    case "routine":
    default:
      return {
        label: lang === "bn" ? "নিয়মিত পর্যবেক্ষণ" : "Routine Advice",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10",
        dotClass: "bg-emerald-400",
        cardBorder: "border-emerald-500/30 bg-gradient-to-br from-emerald-950/15 via-slate-900/80 to-slate-900/90",
      };
  }
}

function getCategoryConfig(category) {
  switch (category) {
    case "irrigation":
      return {
        Icon: Droplets,
        color: "text-cyan-400",
        bgIcon: "bg-cyan-500/10 border-cyan-500/30",
        accent: "text-cyan-300",
      };
    case "crop_selection":
      return {
        Icon: Sprout,
        color: "text-emerald-400",
        bgIcon: "bg-emerald-500/10 border-emerald-500/30",
        accent: "text-emerald-300",
      };
    case "heat_protection":
      return {
        Icon: Thermometer,
        color: "text-orange-400",
        bgIcon: "bg-orange-500/10 border-orange-500/30",
        accent: "text-orange-300",
      };
    case "excess_rainfall":
      return {
        Icon: CloudRain,
        color: "text-sky-400",
        bgIcon: "bg-sky-500/10 border-sky-500/30",
        accent: "text-sky-300",
      };
    case "sowing_timing":
    default:
      return {
        Icon: Calendar,
        color: "text-violet-400",
        bgIcon: "bg-violet-500/10 border-violet-500/30",
        accent: "text-violet-300",
      };
  }
}

export default function FarmerAdvisory({
  selectedDistrict: externalDistrict = null,
  embedded = false,
}) {
  const [district, setDistrict] = useState(externalDistrict || "bogura");
  const [lang, setLang] = useState("en"); // "en" | "bn"
  const [advisoryData, setAdvisoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync with externalDistrict if passed from Unified Dashboard
  useEffect(() => {
    if (externalDistrict && externalDistrict !== district) {
      setDistrict(externalDistrict);
    }
  }, [externalDistrict]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAdvisories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFarmerAdvisories({ district });
      setAdvisoryData(data);
    } catch (err) {
      console.error("Failed to fetch advisories:", err);
      setError(err.message || "Failed to load farmer advisories from server.");
    } finally {
      setLoading(false);
    }
  }, [district]);

  useEffect(() => {
    fetchAdvisories();
  }, [fetchAdvisories]);

  const advisories = advisoryData?.advisories || [];
  const topCrop = advisoryData?.top_recommended_crop;
  const climateSummary = advisoryData?.regional_climate_summary;

  // Embedded view for the Unified Application Dashboard
  if (embedded) {
    return (
      <div
        id="farmer-advisory"
        className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl relative flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Farmer Advisory Engine
              </h3>
              <p className="text-[11px] text-gray-400 capitalize">
                Deterministic Agronomic Directives • {district}
              </p>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLang((l) => (l === "en" ? "bn" : "en"))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-gray-200 transition cursor-pointer"
            title="Toggle English / Bangla"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            {lang === "en" ? "বাংলা" : "English"}
          </button>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 animate-pulse">
            <div className="h-28 bg-white/5 rounded-2xl" />
            <div className="h-28 bg-white/5 rounded-2xl" />
            <div className="h-28 bg-white/5 rounded-2xl" />
            <div className="h-28 bg-white/5 rounded-2xl" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Advisory Cards */}
        {!loading && advisories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {advisories.map((item) => {
              const priorityInfo = getPriorityBadge(item.priority, lang);
              const categoryInfo = getCategoryConfig(item.category);
              const IconComp = categoryInfo.Icon;

              return (
                <div
                  key={item.category}
                  className={`p-4 rounded-2xl border transition-all ${priorityInfo.cardBorder}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs ${categoryInfo.bgIcon}`}
                      >
                        <IconComp className={`w-4 h-4 ${categoryInfo.color}`} />
                      </div>
                      <span className="font-bold text-xs text-white">
                        {lang === "bn" ? item.title_bn : item.title}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${priorityInfo.badgeClass}`}
                    >
                      {priorityInfo.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-200 leading-relaxed font-medium">
                    {lang === "bn" ? item.message_bn : item.message}
                  </p>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{item.rationale}</span>
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
      id="farmer-advisory"
      className="relative py-28 px-6 sm:px-10 lg:px-16 bg-[#070d1a] text-white overflow-hidden border-t border-white/5"
    >
      {/* Background radial glow */}
      <div
        className="absolute top-1/3 right-1/4 w-[600px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-[500px] h-[400px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-sm shadow-cyan-500/10">
              <Lightbulb className="w-3.5 h-3.5" />
              {lang === "bn" ? "কৃষক পরামর্শ সেবা" : "Actionable Agricultural Intelligence"}
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              {lang === "bn" ? (
                <>
                  কৃষক মাঠ <span className="gradient-text">পরামর্শ ইঞ্জিন</span>
                </>
              ) : (
                <>
                  Farmer Advisory <span className="gradient-text">Engine</span>
                </>
              )}
            </h2>
            <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
              {lang === "bn"
                ? "নাসা (NASA) স্যাটেলাইট জলবায়ু ডাটা, ফসল উপযুক্ততা র্যাংকিং এবং দুর্যোগ ঝুঁকি বিশ্লেষণ থেকে তৈরি সরাসরি কার্যকর কৃষি পরামর্শ।"
                : "Deterministic, actionable guidance synthesized from NASA agroclimate telemetry, crop viability models, and regional hazard assessments."}
            </p>
          </div>

          {/* Controls: District Selector & Bilingual Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* District dropdown */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-md">
              <span className="text-xs text-gray-400 font-medium">
                {lang === "bn" ? "জেলা:" : "District:"}
              </span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-2"
              >
                {DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {lang === "bn" ? `${d.nameBn} (${d.name})` : `${d.name} (${d.hub})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  lang === "en"
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("bn")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  lang === "bn"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                বাংলা
              </button>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={fetchAdvisories}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
              title="Refresh advisories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {lang === "bn" ? "রিফ্রেশ" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Top Agronomic Context Bar */}
        <div className="mb-8 p-4 rounded-2xl bg-black/30 border border-white/8 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-gray-300">
              <strong className="text-white">
                {lang === "bn" ? "বর্তমান কৃষি মৌসুম:" : "Agricultural Season Context:"}
              </strong>{" "}
              <span className="text-cyan-300 font-medium">
                {advisoryData?.season_context || "Kharif Season"}
              </span>
            </span>
          </div>

          {climateSummary && (
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-gray-400">
              <span>
                Avg Temp: <strong className="text-white">{climateSummary.avg_temp}°C</strong>
              </span>
              <span>•</span>
              <span>
                Max Temp: <strong className="text-white">{climateSummary.max_temp}°C</strong>
              </span>
              <span>•</span>
              <span>
                Soil Wetness: <strong className="text-white">{climateSummary.soil_moisture}%</strong>
              </span>
              <span>•</span>
              <span>
                Humidity: <strong className="text-white">{climateSummary.avg_humidity}%</strong>
              </span>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-3xl bg-red-950/40 border border-red-500/30 text-white flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchAdvisories}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-200 text-xs font-semibold hover:bg-red-500/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-7 rounded-3xl bg-slate-900/60 border border-white/10 h-64" />
            ))}
          </div>
        )}

        {/* ── 5 ACTIONABLE ADVISORY CARDS GRID ── */}
        {!loading && advisories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advisories.map((item) => {
              const priorityInfo = getPriorityBadge(item.priority, lang);
              const categoryInfo = getCategoryConfig(item.category);
              const IconComponent = categoryInfo.Icon;

              return (
                <div
                  key={item.category}
                  className={`p-7 rounded-3xl glass-card border transition-all duration-300 flex flex-col justify-between shadow-xl ${priorityInfo.cardBorder}`}
                >
                  <div>
                    {/* Top Row: Icon, Category & Priority Badge */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm ${categoryInfo.bgIcon}`}
                        >
                          <IconComponent className={`w-5 h-5 ${categoryInfo.color}`} />
                        </div>
                        <div>
                          <span className={`text-[10px] uppercase font-bold tracking-widest font-mono ${categoryInfo.color}`}>
                            {item.category.replace(/_/g, " ")}
                          </span>
                          <h3 className="font-bold text-white text-base leading-snug">
                            {lang === "bn" ? item.title_bn : item.title}
                          </h3>
                        </div>
                      </div>

                      {/* Priority Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${priorityInfo.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dotClass}`} />
                        {priorityInfo.label}
                      </span>
                    </div>

                    {/* Actionable Message Statement */}
                    <div className="my-4 p-4 rounded-2xl bg-black/40 border border-white/5">
                      <p className="text-xs sm:text-sm text-gray-100 leading-relaxed font-normal">
                        {lang === "bn" ? item.message_bn : item.message}
                      </p>
                    </div>
                  </div>

                  {/* Context Metrics Drawer */}
                  {item.context_metrics && (
                    <div className="pt-3 border-t border-white/8 mt-2">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2 font-mono flex items-center gap-1">
                        <Info className="w-3 h-3 text-cyan-400" />
                        {lang === "bn" ? "পরিমাপিত নির্দেশক মান:" : "Observed Telemetry Justification:"}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(item.context_metrics).map(([key, val]) => (
                          <div
                            key={key}
                            className="px-2.5 py-1 rounded-lg bg-black/30 border border-white/5 text-[11px] font-mono text-gray-300 flex items-center gap-1.5"
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
