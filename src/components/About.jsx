import { Globe, Award, Users, ShieldCheck, ArrowRight, PhoneCall, Sprout, Star } from "lucide-react";

const pillars = [
  {
    icon: Globe,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "hover:border-cyan-400/30",
    title: "NASA Applied Sciences",
    desc: "Built in adherence to NASA Earth Science Division data standards, ensuring research-grade radiometric accuracy for every field boundary.",
  },
  {
    icon: ShieldCheck,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "hover:border-green-400/30",
    title: "Data Sovereignty & Privacy",
    desc: "Your field boundaries, yield records, and farm telemetry remain 100% private — protected by enterprise-grade encryption at rest and in transit.",
  },
  {
    icon: Award,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "hover:border-amber-400/30",
    title: "Regional Agronomic Standards",
    desc: "Calibrated using Bangladesh-oriented agronomic prototype rules for regional AEZs.",
  },
  {
    icon: Users,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "hover:border-purple-400/30",
    title: "Regional Cropping Focus",
    desc: "Engineered specifically for northern Bangladesh cropping cycles, focusing on Bogura, Rangpur, Dinajpur, and Rajshahi.",
  },
];

const testimonials = [
  {
    quote: "Monitoring root-zone moisture through NASA POWER indices helped schedule supplemental irrigation for Boro rice in Bogura, reducing groundwater pumping costs significantly.",
    name: "Tariqul Islam",
    role: "Agronomy Extension Worker, Bogura Region",
    avatar: "TI",
  },
  {
    quote: "During the Rabi transition in Rangpur, the crop suitability recommendations supported shifting land from delayed wheat to hybrid maize, avoiding late-season heat stress.",
    name: "Abdul Hannan",
    role: "Grower & Cooperative Organizer, Rangpur",
    avatar: "AH",
  },
];

export default function About({ onOpenModal }) {
  return (
    <section
      id="about"
      className="relative py-28 px-6 sm:px-10 lg:px-16 bg-[#060b17] text-white overflow-hidden"
    >
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-500/4 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
      <div className="section-divider mb-px" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            About AgriShift AI
          </div>
          <h2
            className="text-4xl sm:text-5xl font-bold leading-tight"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
          >
            Pioneering{" "}
            <span className="gradient-text">Space-Powered</span>{" "}
            Agriculture
          </h2>
          <p className="mt-4 text-gray-400 text-base sm:text-lg leading-relaxed">
            We empower farmers and cooperatives with the computational intelligence needed to sustain crop yields in the face of climate volatility.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className={`group p-7 rounded-3xl glass-card border border-white/8 ${p.border} transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className={`w-11 h-11 rounded-2xl ${p.bg} ${p.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-200">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-7 rounded-3xl glass-card border border-white/8 hover:border-green-400/20 transition-all duration-300"
            >
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed italic mb-5">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA Banner */}
        <div className="relative p-10 sm:p-14 rounded-3xl overflow-hidden text-center border border-green-500/20 shadow-2xl shadow-green-500/5">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-[#060b17] to-teal-950/60" aria-hidden="true" />
          {/* Shimmer overlay */}
          <div className="absolute inset-0 animate-shimmer rounded-3xl" aria-hidden="true" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/20 border border-green-400/30 text-green-400 flex items-center justify-center mx-auto mb-6 animate-float">
              <Sprout className="w-8 h-8" />
            </div>

            <h3
              className="text-3xl sm:text-4xl font-bold text-white max-w-2xl mx-auto leading-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              Ready to Transform Your Farm
              <br />
              <span className="gradient-text">With Satellite Intelligence?</span>
            </h3>

            <p className="text-base text-gray-300 mt-4 max-w-xl mx-auto">
              Join over 1,200 growers leveraging NASA multispectral telemetry for higher yields and reduced climate risk.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={() => onOpenModal && onOpenModal("advisory")}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold text-base shadow-xl shadow-green-500/30 hover:shadow-green-400/50 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
              >
                <Sprout className="w-5 h-5" />
                Explore Demo Farm
              </button>

              <button
                type="button"
                onClick={() => onOpenModal && onOpenModal("contact")}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl border border-white/20 hover:border-white/35 bg-white/8 hover:bg-white/14 text-white font-semibold text-base backdrop-blur-md hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <PhoneCall className="w-5 h-5 text-green-400" />
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
