import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Thermometer, Droplets, Leaf, CloudRain, MapPin, AlertCircle } from "lucide-react";
import { SIMULATED_DATA } from "../services/nasaService";

// Simple sparkline bars (purely decorative, replace with real chart later)
function MiniChart({ color, values = [40, 60, 45, 70, 55, 80, 65] }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ background: color, opacity: 0.6 + (i / values.length) * 0.4 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.05 * i, duration: 0.4 }}
          style2={{ height: `${(v / max) * 100}%` }}
        >
          <div style={{ height: `${(v / max) * 100}%`, background: color, borderRadius: "2px 2px 0 0", opacity: 0.6 + (i / values.length) * 0.4 }} />
        </motion.div>
      ))}
    </div>
  );
}

const metrics = [
  {
    icon: Thermometer,
    label: "Temperature",
    value: `${SIMULATED_DATA.temperature}°C`,
    sub: "Surface air temp",
    color: "#fb923c",
    border: "border-orange-500/20",
    chart: [28, 30, 32, 31, 33, 32, 32],
    source: "NASA POWER",
  },
  {
    icon: CloudRain,
    label: "Rainfall",
    value: `${SIMULATED_DATA.rainfall} mm`,
    sub: "Monthly total",
    color: "#60a5fa",
    border: "border-blue-500/20",
    chart: [80, 95, 110, 105, 115, 118, 120],
    source: "TRMM / GPM",
  },
  {
    icon: Droplets,
    label: "Soil Moisture",
    value: `${SIMULATED_DATA.soilMoisture}%`,
    sub: "Root-zone 0–100cm",
    color: "#22d3ee",
    border: "border-cyan-500/20",
    chart: [38, 41, 44, 42, 46, 45, 45],
    source: "NASA SMAP",
  },
  {
    icon: Leaf,
    label: "NDVI",
    value: SIMULATED_DATA.ndvi.toFixed(2),
    sub: "Vegetation index",
    color: "#4ade80",
    border: "border-green-500/20",
    chart: [0.65, 0.70, 0.73, 0.76, 0.79, 0.81, 0.82].map(v => v * 100),
    source: "Landsat-9 / MODIS",
  },
];

export default function NasaDataSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="nasa-data" ref={ref} className="relative py-28 px-6 sm:px-10 bg-[#060b17] overflow-hidden">
      <div className="section-divider mb-px" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/4 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <motion.span
            className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Step 3 — NASA Earth Observation
          </motion.span>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mt-4"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
          >
            NASA Earth <span className="gradient-text">Observation Data</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 mt-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          >
            Environmental telemetry for{" "}
            <span className="inline-flex items-center gap-1 text-green-300">
              <MapPin className="w-3.5 h-3.5" /> {SIMULATED_DATA.location}
            </span>
          </motion.p>
        </div>

        {/* Simulation disclaimer */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-12 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-lg mx-auto"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            <strong>Simulation Data</strong> — These values are demo placeholders. Connect the NASA POWER API to show real telemetry.
          </p>
        </motion.div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                className={`glass-card rounded-3xl p-6 border ${m.border} hover:scale-[1.02] transition-all duration-300 group`}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: m.color }} />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">{m.source}</span>
                </div>
                <p className="text-sm text-gray-400 mb-1">{m.label}</p>
                <p className="text-3xl font-bold mb-0.5" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[11px] text-gray-500 mb-4">{m.sub}</p>

                {/* Mini chart */}
                <div className="flex items-end gap-1 h-10">
                  {m.chart.map((v, j) => {
                    const max = Math.max(...m.chart);
                    const pct = (v / max) * 100;
                    return (
                      <motion.div
                        key={j}
                        className="flex-1 rounded-t-sm"
                        style={{ background: m.color, opacity: 0.3 + (j / m.chart.length) * 0.7 }}
                        initial={{ scaleY: 0, originY: 1 }}
                        animate={inView ? { scaleY: 1 } : {}}
                        transition={{ delay: 0.4 + j * 0.05 + i * 0.05, duration: 0.4 }}
                      >
                        <div style={{ height: `${pct}%`, minHeight: 3, background: m.color, borderRadius: "2px 2px 0 0" }} />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Vegetation health banner */}
        <motion.div
          className="glass-card rounded-3xl p-6 border border-green-500/20 flex flex-col sm:flex-row items-center gap-6"
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Vegetation Health Status</p>
              <p className="text-2xl font-bold text-green-400">{SIMULATED_DATA.vegetationHealth}</p>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Overall Index</span>
              <span>82%</span>
            </div>
            <div className="w-full h-3 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                initial={{ width: 0 }} animate={inView ? { width: "82%" } : {}} transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-gray-500">Last Updated</p>
            <p className="text-xs text-gray-300 font-mono">Simulated • Demo</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
