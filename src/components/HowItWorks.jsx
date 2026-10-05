import { Satellite, Cpu, Tractor, ArrowRight, Sparkles, MoveRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Satellite,
    color: "text-cyan-400",
    bg: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/20 hover:border-cyan-400/50",
    lineBg: "bg-gradient-to-r from-cyan-400 to-green-400",
    title: "Daily Orbital Ingestion",
    desc: "Raw multispectral and thermal imagery from NASA Landsat-8/9, Sentinel-2, and SMAP pulled within minutes of satellite downlink.",
    detail: "Automated · Cloud-native · Zero latency pipeline",
  },
  {
    num: "02",
    icon: Cpu,
    color: "text-green-400",
    bg: "from-green-500/20 to-green-500/5",
    border: "border-green-500/20 hover:border-green-400/50",
    lineBg: "bg-gradient-to-r from-green-400 to-emerald-400",
    title: "AI Agro-Calibration",
    desc: "Deep neural networks cross-correlate spectral reflectance with regional soil surveys, topography, and historical weather patterns.",
    detail: "Computer Vision · Weather Models · Soil DB Fusion",
  },
  {
    num: "03",
    icon: Tractor,
    color: "text-emerald-400",
    bg: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20 hover:border-emerald-400/50",
    lineBg: "bg-gradient-to-r from-emerald-400 to-teal-400",
    title: "Field Prescription & Action",
    desc: "Farmers receive pinpoint recommendations for crop rotation, variable-rate fertilizer zones, and optimized irrigation schedules.",
    detail: "Cab Export Ready · Mobile Dashboard · Agronomist Review",
  },
];

export default function HowItWorks({ onOpenModal }) {
  return (
    <section
      id="how-it-works"
      className="relative py-28 px-6 sm:px-10 lg:px-16 bg-[#060b17] text-white overflow-hidden"
    >
      {/* Glow blob */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="section-divider mb-px" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Streamlined Workflow
          </div>
          <h2
            className="text-4xl sm:text-5xl font-bold leading-tight"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
          >
            From Orbit to Field{" "}
            <span className="gradient-text">in 3 Steps</span>
          </h2>
          <p className="mt-4 text-gray-400 text-base sm:text-lg leading-relaxed">
            A fully automated pipeline from space observation to precise ground action — no manual work required.
          </p>
        </div>

        {/* Steps — desktop horizontal connector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-gradient-to-r from-cyan-400/40 via-green-400/40 to-emerald-400/40 z-0" aria-hidden="true" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className={`group relative p-8 rounded-3xl glass-card border ${step.border} transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 flex flex-col overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${step.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl`} aria-hidden="true" />

                <div className="relative z-10">
                  {/* Icon + number */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.bg} border border-white/10 flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-5xl font-black text-white/8 group-hover:text-white/15 transition-colors font-mono">
                      {step.num}
                    </span>
                  </div>

                  <h3 className={`text-xl font-bold text-white group-hover:${step.color.replace("text-", "text-")} transition-colors duration-200`}>
                    {step.title}
                  </h3>

                  <p className="text-sm text-gray-400 mt-3 leading-relaxed group-hover:text-gray-300 transition-colors duration-200">
                    {step.desc}
                  </p>

                  {/* Bottom detail */}
                  <div className="mt-6 pt-4 border-t border-white/8 text-xs font-mono text-gray-500">
                    {step.detail}
                  </div>
                </div>

                {/* Arrow connector badge */}
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3.5 top-12 z-20 w-7 h-7 rounded-full bg-[#060b17] border border-white/15 items-center justify-center shadow-lg">
                    <MoveRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Callout */}
        <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-green-950/50 via-emerald-950/30 to-teal-950/50 border border-green-500/25 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-yellow-300 font-semibold text-sm mb-2">
              <Sparkles className="w-4 h-4" />
              Experience it Live
            </div>
            <h4 className="text-2xl font-bold text-white">
              Run the AI Simulation in Real Time
            </h4>
            <p className="text-sm text-gray-300 mt-1">
              Test how AgriShift AI recommends crops and manages water based on your soil profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenModal && onOpenModal("advisory")}
            className="shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold text-sm shadow-xl shadow-green-500/30 hover:shadow-green-400/50 hover:scale-[1.04] transition-all duration-300 cursor-pointer"
          >
            Launch AI Simulator
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
