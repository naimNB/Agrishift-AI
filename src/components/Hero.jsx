import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import heroBg from "../assets/hero-bg.webp";
import {
  ArrowRight, ChevronDown, Satellite, MapPin,
  Thermometer, Droplets, Wind, Leaf,
  Compass, Sprout, ShieldAlert, Lightbulb, Activity,
} from "lucide-react";

const floatingCards = [
  { icon: Thermometer, label: "Temperature", value: "32°C", color: "text-orange-400", border: "border-orange-500/30", delay: 0 },
  { icon: Droplets, label: "Soil Moisture", value: "45%", color: "text-blue-400", border: "border-blue-500/30", delay: 0.15 },
  { icon: Leaf, label: "NDVI", value: "0.82", color: "text-green-400", border: "border-green-500/30", delay: 0.3 },
  { icon: Wind, label: "Rainfall", value: "120mm", color: "text-cyan-400", border: "border-cyan-500/30", delay: 0.45 },
];

export default function Hero({ onOpenModal }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Parallax Background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})`, y }}
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-[#060b17]" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/30 via-transparent to-cyan-950/20" />

      {/* Animated glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px] animate-pulse-glow pointer-events-none" style={{ animationDelay: "1.2s" }} />

      {/* Floating satellite icon */}
      <motion.div
        className="absolute top-24 right-[8%] text-cyan-400/60 hidden lg:block"
        animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Satellite className="w-10 h-10" />
      </motion.div>

      {/* Floating location marker */}
      <motion.div
        className="absolute bottom-40 left-[8%] hidden lg:flex flex-col items-center gap-1"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
      >
        <div className="relative">
          <MapPin className="w-7 h-7 text-green-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
        </div>
        <span className="text-[10px] text-green-300/80 font-semibold tracking-wide whitespace-nowrap">Bogura, BD</span>
      </motion.div>

      {/* Floating data cards */}
      <div className="absolute inset-0 pointer-events-none hidden xl:block">
        {floatingCards.map((card, i) => {
          const positions = [
            "top-[22%] left-[4%]",
            "top-[38%] left-[3%]",
            "top-[22%] right-[4%]",
            "top-[38%] right-[3%]",
          ];
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              className={`absolute ${positions[i]} glass-card border ${card.border} rounded-2xl px-4 py-3 flex items-center gap-3`}
              initial={{ opacity: 0, x: i < 2 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
              transition={{
                opacity: { delay: 0.8 + card.delay, duration: 0.6 },
                x: { delay: 0.8 + card.delay, duration: 0.6 },
                y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: card.delay },
              }}
            >
              <Icon className={`w-4 h-4 ${card.color} shrink-0`} />
              <div>
                <p className="text-[10px] text-gray-400 leading-none mb-0.5">{card.label}</p>
                <p className={`text-sm font-bold ${card.color}`}>{card.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto px-6 sm:px-10 pt-24 pb-32"
        style={{ opacity }}
      >
        {/* Live badge */}
        <motion.a
          href="#dashboard"
          className="inline-flex items-center gap-2.5 bg-black/50 border border-green-500/30 hover:border-green-400/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold text-green-300 hover:text-green-200 transition-all duration-300 mb-8 cursor-pointer group"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          <Satellite className="w-3.5 h-3.5" />
          NASA POWER Agroclimatology — Live Telemetry
          <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
        </motion.a>

        {/* Headline */}
        <motion.h1
          className="text-white font-bold leading-[1.08] tracking-tight text-5xl sm:text-6xl lg:text-7xl xl:text-8xl"
          style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Transform Farming
          <br />
          with{" "}
          <span className="gradient-text">NASA Earth</span>
          <br />
          Intelligence
        </motion.h1>

        <motion.p
          className="text-gray-300 text-lg sm:text-xl mt-8 max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          AI-powered insights for climate-resilient and sustainable agriculture —
          calibrated with NASA agroclimatology telemetry across Northern Bangladesh.
        </motion.p>

        {/* Stats */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-8 mt-10 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { val: "8+", label: "Agroclimate Parameters" },
            { val: "5", label: "Northern Bangladesh Zones" },
            { val: "Daily", label: "NASA POWER Telemetry" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-3xl font-bold gradient-text-warm">{s.val}</span>
              <span className="text-xs text-gray-400 mt-1">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <a
            href="#dashboard"
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-green-500/30 hover:shadow-green-400/50 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
          >
            Explore Demo Farm
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#farm-map"
            className="inline-flex items-center gap-2.5 border border-white/20 hover:border-white/40 bg-white/8 hover:bg-white/14 text-white px-8 py-4 rounded-2xl font-semibold text-base backdrop-blur-md hover:scale-[1.02] transition-all duration-300 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            Live Map
          </a>
        </motion.div>

        {/* Quick Module Jump Pills */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <span className="text-xs text-gray-400 mr-1 hidden sm:inline">Quick Jump:</span>
          <a
            href="#crop-recommendation"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 hover:border-emerald-500/40 text-xs font-medium text-gray-300 hover:text-emerald-300 transition-all duration-200 cursor-pointer"
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-400" />
            Crop Advisory
          </a>
          <a
            href="#climate-risk"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 hover:border-rose-500/40 text-xs font-medium text-gray-300 hover:text-rose-300 transition-all duration-200 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Climate Risk
          </a>
          <a
            href="#farmer-advisory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 hover:border-cyan-500/40 text-xs font-medium text-gray-300 hover:text-cyan-300 transition-all duration-200 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
            Farmer Advisory
          </a>
          <a
            href="#historical-trends"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 hover:border-cyan-500/40 text-xs font-medium text-gray-300 hover:text-cyan-300 transition-all duration-200 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Historical Trends
          </a>
          <a
            href="#nasa-data"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 hover:border-blue-500/40 text-xs font-medium text-gray-300 hover:text-blue-300 transition-all duration-200 cursor-pointer"
          >
            <Satellite className="w-3.5 h-3.5 text-blue-400" />
            NASA Data
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        href="#dashboard"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-400 hover:text-green-400 transition-colors duration-200"
        aria-label="Scroll down to dashboard"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase opacity-60">Scroll</span>
        <ChevronDown className="w-5 h-5" />
      </motion.a>
    </section>
  );
}