import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Layers } from "lucide-react";

const zones = [
  { id: "A", label: "Zone A", health: 86, moisture: 42, ndvi: 0.86, status: "Excellent", color: "#4ade80", intensity: "bg-green-500/35 border-green-400/50" },
  { id: "B", label: "Zone B", health: 71, moisture: 34, ndvi: 0.71, status: "Good", color: "#a3e635", intensity: "bg-lime-500/25 border-lime-400/40" },
  { id: "C", label: "Zone C", health: 91, moisture: 50, ndvi: 0.91, status: "Excellent", color: "#22d3ee", intensity: "bg-cyan-500/30 border-cyan-400/40" },
  { id: "D", label: "Zone D", health: 63, moisture: 29, ndvi: 0.63, status: "Moderate", color: "#fb923c", intensity: "bg-orange-500/25 border-orange-400/40" },
];

const fieldLayout = [
  [null, "A", "A", "B"],
  ["A", "A", "B", "B"],
  ["C", "C", "D", "D"],
  ["C", "C", "D", null],
];

function HealthBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function FieldAnalysis() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [active, setActive] = useState(null);
  const activeZone = zones.find(z => z.id === active);

  return (
    <section id="field-analysis" ref={ref} className="relative py-28 px-6 sm:px-10 bg-[#050a15] overflow-hidden">
      <div className="section-divider mb-px" />
      <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          >
            <Layers className="w-3.5 h-3.5" />
            Step 4 — Field Analysis
          </motion.span>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mt-4"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
          >
            Interactive <span className="gradient-text">Field Map</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 mt-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          >
            Hover over any zone to inspect real-time vegetation health, moisture, and NDVI readings.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* Field Grid */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <p className="text-xs font-mono text-gray-500 mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                NDVI Zone Map — Bogura, Bangladesh — 120 acres
              </p>

              {/* Grid */}
              <div className="grid grid-cols-4 gap-2" style={{ aspectRatio: "4/3" }}>
                {fieldLayout.flat().map((id, i) => {
                  const zone = zones.find(z => z.id === id);
                  if (!zone) return <div key={i} className="rounded-xl bg-white/3" />;

                  return (
                    <motion.div
                      key={`${id}-${i}`}
                      className={`rounded-xl border cursor-pointer transition-all duration-300 flex items-center justify-center relative ${zone.intensity} ${active === id ? "scale-[1.03] z-10" : "hover:scale-[1.02]"}`}
                      onMouseEnter={() => setActive(id)}
                      onMouseLeave={() => setActive(null)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.03 }}
                      style={{
                        boxShadow: active === id ? `0 0 20px ${zone.color}50` : "none",
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: zone.color }}>
                        {id}
                      </span>

                      {/* NDVI heatmap shimmer */}
                      {active === id && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          style={{ background: `${zone.color}15` }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-5">
                {zones.map(z => (
                  <div key={z.id} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: z.color }} />
                    <span className="text-[11px] text-gray-400">Zone {z.id} · {z.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Detail Panel */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {activeZone ? (
                <motion.div
                  key={activeZone.id}
                  className="glass-card rounded-3xl p-6 border"
                  style={{ borderColor: `${activeZone.color}40` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: `${activeZone.color}20`, color: activeZone.color }}>
                      {activeZone.id}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{activeZone.label}</p>
                      <p className="text-xs" style={{ color: activeZone.color }}>{activeZone.status}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Vegetation Health</p>
                      <HealthBar value={activeZone.health} color={activeZone.color} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Soil Moisture</p>
                      <HealthBar value={activeZone.moisture} color="#60a5fa" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">NDVI Index</p>
                      <HealthBar value={Math.round(activeZone.ndvi * 100)} color="#a3e635" />
                    </div>
                  </div>

                  <div className="mt-5 p-3 rounded-xl text-xs" style={{ background: `${activeZone.color}10`, border: `1px solid ${activeZone.color}30` }}>
                    <p className="font-semibold mb-0.5" style={{ color: activeZone.color }}>AI Recommendation</p>
                    <p className="text-gray-400">
                      {activeZone.health >= 80
                        ? "Optimal conditions. Maintain current irrigation schedule."
                        : activeZone.health >= 65
                        ? "Slightly stressed. Consider 15% irrigation increase."
                        : "Needs attention. Soil analysis and nutrient correction advised."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="glass-card rounded-3xl p-8 border border-white/8 flex flex-col items-center justify-center text-center min-h-[300px]"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <Layers className="w-10 h-10 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium">Hover a zone</p>
                  <p className="text-gray-600 text-sm mt-1">to inspect field data</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Zone summary cards */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {zones.map(z => (
                <motion.div
                  key={z.id}
                  className="glass-card rounded-2xl p-3 border cursor-pointer transition-all duration-200"
                  style={{ borderColor: active === z.id ? `${z.color}60` : "rgba(255,255,255,0.08)" }}
                  onMouseEnter={() => setActive(z.id)}
                  onMouseLeave={() => setActive(null)}
                  initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: z.color }}>Zone {z.id}</p>
                  <p className="text-[10px] text-gray-500">{z.status}</p>
                  <div className="w-full h-1 bg-white/8 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.health}%`, background: z.color }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
