import { TrendingUp, Droplets, Sprout, DollarSign, ArrowRight, Calculator, FileText } from "lucide-react";

const stats = [
  {
    value: "−34%",
    label: "Water Saved",
    sub: "Across 1,400 ha of almond orchards during severe drought",
    icon: Droplets,
    color: "text-blue-400",
    bg: "from-blue-500/15 to-transparent",
    border: "border-blue-500/20 hover:border-blue-400/40",
  },
  {
    value: "+19.2%",
    label: "Avg Yield Increase",
    sub: "Documented across 3,200 ha in the Midwestern Grain Belt",
    icon: Sprout,
    color: "text-green-400",
    bg: "from-green-500/15 to-transparent",
    border: "border-green-500/20 hover:border-green-400/40",
  },
  {
    value: "−26%",
    label: "Fertilizer Waste",
    sub: "Precision nitrogen mapping preventing excess groundwater run-off",
    icon: TrendingUp,
    color: "text-amber-400",
    bg: "from-amber-500/15 to-transparent",
    border: "border-amber-500/20 hover:border-amber-400/40",
  },
  {
    value: "$138",
    label: "Net Gain / Acre",
    sub: "Combined savings from input reduction and enhanced harvest",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "from-emerald-500/15 to-transparent",
    border: "border-emerald-500/20 hover:border-emerald-400/40",
  },
];

export default function Impact({ onOpenModal }) {
  return (
    <section
      id="impact"
      className="relative py-28 px-6 sm:px-10 lg:px-16 bg-[#07101f] text-white overflow-hidden"
    >
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="section-divider mb-px" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Verified Field Impact
          </div>
          <h2
            className="text-4xl sm:text-5xl font-bold leading-tight"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
          >
            Proven Economic &{" "}
            <span className="gradient-text">Ecological Returns</span>
          </h2>
          <p className="mt-4 text-gray-400 text-base sm:text-lg leading-relaxed">
            Real results from commercial growers who transformed their seasonal planning using NASA Earth data analytics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`group relative p-7 rounded-3xl glass-card border ${stat.border} transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl`} aria-hidden="true" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
                      Verified
                    </span>
                  </div>

                  <div className={`text-5xl font-black ${stat.color} tracking-tight stat-value`}>
                    {stat.value}
                  </div>

                  <div className="text-base font-bold text-white mt-2">
                    {stat.label}
                  </div>

                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {stat.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dual Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ROI Calculator */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-emerald-950/20 to-[#07101f] border border-emerald-500/25 hover:border-emerald-400/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
                <Calculator className="w-4 h-4" />
                Interactive Economic Calculator
              </div>
              <h3
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
              >
                Estimate Your Acreage Gains
              </h3>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                Input your farm size to model water savings, reduced nitrogen costs, and yield improvements.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenModal && onOpenModal("roi")}
              className="mt-6 w-fit inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
            >
              Calculate My Farm ROI
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Case Studies */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-950/60 via-blue-950/20 to-[#07101f] border border-blue-500/25 hover:border-blue-400/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
                <FileText className="w-4 h-4" />
                Peer-Reviewed Field Audits
              </div>
              <h3
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
              >
                Explore Independent Case Studies
              </h3>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                Read how commercial grower cooperatives mitigated drought conditions and preserved seasonal margins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenModal && onOpenModal("cases")}
              className="mt-6 w-fit inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-black font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-400/40 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
            >
              Read Case Studies
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
