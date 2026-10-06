import { Satellite, Globe, ArrowRight, Activity, CheckCircle2 } from "lucide-react";

const satellites = [
  {
    name: "Landsat-8 & Landsat-9",
    instrument: "OLI-2 / TIRS-2",
    cadence: "8-Day Revisit",
    resolution: "15m Pan · 30m Multispectral",
    desc: "Captures thermal infrared signatures and visible spectral bands to gauge canopy surface temperature and cellular vegetation vitality.",
    badges: ["Canopy Temp", "NDVI", "Thermal Stress"],
    color: "border-orange-500/30 hover:border-orange-400/50",
    accent: "text-orange-400",
    glowColor: "bg-orange-500/5",
  },
  {
    name: "Sentinel-2 (Copernicus)",
    instrument: "MultiSpectral MSI",
    cadence: "5-Day Combined Revisit",
    resolution: "10m High-Res",
    desc: "13 spectral bands engineered for red-edge chlorophyll absorption, nitrogen modeling, and active growth stage tracking.",
    badges: ["10m Resolution", "Red-Edge Chl", "Cloud Masking"],
    color: "border-cyan-500/30 hover:border-cyan-400/50",
    accent: "text-cyan-400",
    glowColor: "bg-cyan-500/5",
  },
  {
    name: "NASA SMAP",
    instrument: "L-Band Radar / Radiometer",
    cadence: "2–3 Day Global",
    resolution: "Top 5cm Soil + Root",
    desc: "Penetrates cloud cover and canopy vegetation to measure dielectric properties of topsoil and root-zone soil moisture.",
    badges: ["Root Moisture", "Drought Track", "All-Weather"],
    color: "border-blue-500/30 hover:border-blue-400/50",
    accent: "text-blue-400",
    glowColor: "bg-blue-500/5",
  },
  {
    name: "ECOSTRESS (ISS)",
    instrument: "Thermal Radiometer",
    cadence: "High Temporal",
    resolution: "70m Evapotranspiration",
    desc: "Mounted on the International Space Station, monitoring diurnal plant water stress and cooling efficiency across field sectors.",
    badges: ["ET Flux", "Water Efficiency", "Diurnal Cycle"],
    color: "border-emerald-500/30 hover:border-emerald-400/50",
    accent: "text-emerald-400",
    glowColor: "bg-emerald-500/5",
  },
];

export default function NasaData({ onOpenModal }) {
  return (
    <section
      id="nasa-data"
      className="relative py-28 px-6 sm:px-10 lg:px-16 bg-[#070d1a] text-white overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/6 rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />
      <div className="section-divider mb-px" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Satellite className="w-3.5 h-3.5" />
              NASA Earth Observation Program
            </div>
            <h2
              className="text-4xl sm:text-5xl font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              Orbital Earth Science{" "}
              <span className="gradient-text">Data Engine</span>
            </h2>
            <p className="mt-4 text-gray-400 text-base sm:text-lg leading-relaxed">
              Petabytes of NASA Earth data ingested and calibrated daily — converting space-grade telemetry into precision farm intelligence.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenModal && onOpenModal("specs")}
              className="px-5 py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-400/60 text-cyan-300 text-sm font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              Sensor Specs
            </button>
            <a
              href="#dashboard"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-500/25 hover:shadow-green-400/40 transition-all duration-200 cursor-pointer"
            >
              Live Telemetry
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-xs sm:text-sm font-mono text-cyan-300">
              Constellation Status:{" "}
              <strong className="text-emerald-400">NOMINAL & OPERATIONAL</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-emerald-400" />Landsat-9: 38m ago</span>
            <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-cyan-400" />Sentinel-2: 14m ago</span>
            <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-green-400" />Ingestion: 99.98%</span>
          </div>
        </div>

        {/* Satellite Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {satellites.map((sat) => (
            <div
              key={sat.name}
              className={`group relative p-7 rounded-3xl glass-card ${sat.color} transition-all duration-300 hover:scale-[1.015] overflow-hidden`}
            >
              <div className={`absolute inset-0 ${sat.glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl`} aria-hidden="true" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <h3 className={`text-lg font-bold text-white`}>{sat.name}</h3>
                  <span className={`shrink-0 text-xs font-mono ${sat.accent} bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg ml-3`}>
                    {sat.instrument}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium text-gray-400 mb-3">
                  <span>{sat.cadence}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  <span>{sat.resolution}</span>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed mb-5">{sat.desc}</p>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/8">
                  {sat.badges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/25 px-2.5 py-0.5 rounded-md"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
