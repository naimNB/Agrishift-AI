import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Satellite, Radio, Wifi, Activity } from "lucide-react";

export default function SatelliteSimulation() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const satelliteX = useTransform(scrollYProgress, [0, 1], ["-20%", "120%"]);

  return (
    <section id="satellite-simulation" ref={ref} className="relative py-28 px-6 sm:px-10 overflow-hidden bg-[#050a15]">
      <div className="section-divider mb-px" />

      {/* Deep space background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(56,189,248,0.07)_0%,transparent_70%)]" />
      {[...Array(60)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
          }}
        />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            className="inline-flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full mb-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.5 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Step 2 — Satellite
          </motion.span>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mt-4"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
          >
            Satellite <span className="gradient-text">Monitoring</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-base sm:text-lg mt-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
          >
            AgriShift AI combines Earth observation data with local farm information — collecting imagery every 16 days from 400 miles up.
          </motion.p>
        </div>

        {/* Satellite pass visualiser */}
        <div className="relative h-64 sm:h-80 flex items-center justify-center mb-16 overflow-hidden">
          {/* Orbit arc */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 280" preserveAspectRatio="none">
            <ellipse cx="400" cy="400" rx="500" ry="380" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1" strokeDasharray="6 6" />
            {/* Beam lines */}
            <motion.g initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}>
              <line x1="400" y1="0" x2="300" y2="280" stroke="rgba(74,222,128,0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="400" y1="0" x2="500" y2="280" stroke="rgba(74,222,128,0.3)" strokeWidth="1" strokeDasharray="4 4" />
            </motion.g>
          </svg>

          {/* Moving satellite */}
          <motion.div
            className="absolute top-0 flex flex-col items-center gap-2"
            style={{ x: satelliteX }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl glass-card border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Satellite className="w-8 h-8 text-cyan-400" />
            </motion.div>

            {/* Data pulses */}
            {inView && (
              <>
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-green-400"
                  animate={{ y: [0, 120], opacity: [1, 0], scale: [1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.8 }}
                />
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400"
                  animate={{ y: [0, 120], opacity: [1, 0], scale: [1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.8, delay: 0.4 }}
                />
              </>
            )}
          </motion.div>

          {/* Ground target */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Ripple rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-green-400/30"
                style={{ width: 40 + i * 30, height: 40 + i * 30 }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
            <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center">
              <span className="text-xs font-bold text-green-400">BD</span>
            </div>
          </motion.div>
        </div>

        {/* Satellite constellation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { name: "Landsat-9", type: "OLI-2 / TIRS-2", revisit: "16 days", res: "30m", color: "text-cyan-400", border: "border-cyan-500/20" },
            { name: "Sentinel-2", type: "MSI Multispectral", revisit: "5 days", res: "10m", color: "text-blue-400", border: "border-blue-500/20" },
            { name: "SMAP", type: "L-band Radar", revisit: "3 days", res: "36km", color: "text-green-400", border: "border-green-500/20" },
            { name: "ECOSTRESS", type: "TIR Thermal", revisit: "~4 days", res: "70m", color: "text-orange-400", border: "border-orange-500/20" },
          ].map((sat, i) => (
            <motion.div
              key={sat.name}
              className={`glass-card rounded-2xl p-5 border ${sat.border} hover:scale-[1.02] transition-all duration-300`}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Radio className={`w-4 h-4 ${sat.color}`} />
                <span className={`text-sm font-bold ${sat.color}`}>{sat.name}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{sat.type}</p>
              <div className="flex justify-between text-xs">
                <div>
                  <p className="text-gray-500">Revisit</p>
                  <p className="text-white font-semibold">{sat.revisit}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Resolution</p>
                  <p className="text-white font-semibold">{sat.res}</p>
                </div>
              </div>
              {/* Signal indicator */}
              <div className="flex items-center gap-1 mt-3">
                {[...Array(5)].map((_, j) => (
                  <motion.div
                    key={j}
                    className="flex-1 rounded-full"
                    style={{ height: 3 + j * 1.5, background: j < 4 ? "#4ade80" : "#1f2937" }}
                    animate={inView ? { scaleY: [1, 1.4, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
