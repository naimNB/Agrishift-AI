import { Satellite, Sprout, Droplets, BrainCircuit, BarChart3, Shield, ArrowRight } from "lucide-react";

const cards = [
  {
    icon: Satellite,
    color: "text-cyan-400",
    bg: "from-cyan-500/15 to-cyan-500/5",
    border: "hover:border-cyan-400/40",
    glow: "group-hover:shadow-cyan-500/20",
    title: "Satellite Monitoring",
    description:
      "Real-time NASA Earth observation data tracking plant health (NDVI) and field conditions — from 400 miles up.",
    badge: "Real-Time",
    badgeColor: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    actionText: "Explore NASA Data",
    targetHref: "#nasa-data",
  },
  {
    icon: BrainCircuit,
    color: "text-green-400",
    bg: "from-green-500/15 to-green-500/5",
    border: "hover:border-green-400/40",
    glow: "group-hover:shadow-green-500/20",
    title: "AI Crop Recommendations",
    description:
      "Deep neural networks match your soil composition and regional climate to the highest-yielding crop varieties.",
    badge: "AI-Powered",
    badgeColor: "text-green-300 bg-green-500/10 border-green-500/20",
    actionText: "Crop Intelligence Engine",
    targetHref: "#crop-recommendation",
  },
  {
    icon: Droplets,
    color: "text-blue-400",
    bg: "from-blue-500/15 to-blue-500/5",
    border: "hover:border-blue-400/40",
    glow: "group-hover:shadow-blue-500/20",
    title: "Moisture & Water Insights",
    description:
      "NASA agroclimate telemetry measures topsoil and root-zone moisture to optimize irrigation scheduling and groundwater conservation.",
    badge: "Root-Zone Index",
    badgeColor: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    actionText: "Inspect Moisture Trends",
    targetHref: "#historical-trends",
  },
  {
    icon: BarChart3,
    color: "text-amber-400",
    bg: "from-amber-500/15 to-amber-500/5",
    border: "hover:border-amber-400/40",
    glow: "group-hover:shadow-amber-500/20",
    title: "Suitability & Risk Modeling",
    description:
      "Predictive models combine temperature, precipitation, and moisture trends with regional crop thresholds to evaluate seasonal viability.",
    badge: "Suitability Model",
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    actionText: "Analyze Climate Risk",
    targetHref: "#climate-risk",
  },
  {
    icon: Sprout,
    color: "text-emerald-400",
    bg: "from-emerald-500/15 to-emerald-500/5",
    border: "hover:border-emerald-400/40",
    glow: "group-hover:shadow-emerald-500/20",
    title: "Agro-Ecological Analytics",
    description:
      "Monitoring canopy vegetative vitality, thermal stress, and soil texture constraints across regional agricultural zones.",
    badge: "Regional Zones",
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    actionText: "Interactive GIS Farm Map",
    targetHref: "#farm-map",
  },
  {
    icon: Shield,
    color: "text-purple-400",
    bg: "from-purple-500/15 to-purple-500/5",
    border: "hover:border-purple-400/40",
    glow: "group-hover:shadow-purple-500/20",
    title: "Climate Risk Alerts",
    description:
      "Early-warning systems detect frost, drought, and flood risk events, giving you a 5–14 day planning window.",
    badge: "Early Warning",
    badgeColor: "text-purple-300 bg-purple-500/10 border-purple-500/20",
    actionText: "View Farmer Advisories",
    targetHref: "#farmer-advisory",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-28 px-6 sm:px-10 bg-[#060b17] text-white overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="section-divider mb-px" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Core Features
          </span>

          <h2
            className="text-4xl sm:text-5xl font-bold mt-4 leading-tight"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
          >
            Intelligent Tools for{" "}
            <span className="gradient-text">Smarter Farming</span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg mt-4 leading-relaxed">
            Six precision capabilities powered by space-grade data and AI — working in concert to maximize every acre.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`group relative p-7 rounded-3xl glass-card ${card.border} transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${card.glow} overflow-hidden flex flex-col justify-between`}
              >
                {/* Card inner glow gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl`} aria-hidden="true" />

                <div className="relative z-10">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.bg} border border-white/10 flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-green-100 transition-colors duration-200">
                    {card.title}
                  </h3>

                  <p className="text-sm text-gray-400 mt-2.5 leading-relaxed group-hover:text-gray-300 transition-colors duration-200">
                    {card.description}
                  </p>
                </div>

                <div className="relative z-10 pt-4 mt-5 border-t border-white/8">
                  <a
                    href={card.targetHref}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 group/link transition-colors cursor-pointer"
                  >
                    <span>{card.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
