import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Radar, MapPin, CheckCircle2, Loader2 } from "lucide-react";

const SCAN_STEPS = [
  { pct: 0, label: "Initialising scan..." },
  { pct: 25, label: "Detecting field boundary..." },
  { pct: 50, label: "Reading NDVI signature..." },
  { pct: 75, label: "Analysing soil moisture..." },
  { pct: 100, label: "Satellite Observation Complete" },
];

const zones = [
  { id: "A", x: "20%", y: "22%", w: 140, h: 90, color: "#4ade80", health: 86, moisture: 42 },
  { id: "B", x: "52%", y: "18%", w: 120, h: 80, color: "#22d3ee", health: 71, moisture: 34 },
  { id: "C", x: "18%", y: "55%", w: 150, h: 85, color: "#a3e635", health: 91, moisture: 50 },
  { id: "D", x: "54%", y: "54%", w: 130, h: 90, color: "#fb923c", health: 63, moisture: 29 },
];

export default function FarmSimulation() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [phase, setPhase] = useState("idle"); // idle | scanning | done
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [hoveredZone, setHoveredZone] = useState(null);

  const startScan = () => {
    if (phase !== "idle") return;
    setPhase("scanning");
    setProgress(0);
    setStepIdx(0);

    SCAN_STEPS.forEach((step, i) => {
      setTimeout(() => {
        setProgress(step.pct);
        setStepIdx(i);
        if (i === SCAN_STEPS.length - 1) {
          setTimeout(() => setPhase("done"), 800);
        }
      }, i * 900);
    });
  };

  const reset = () => { setPhase("idle"); setProgress(0); setStepIdx(0); };

  return (
    <section id="farm-simulation" ref={ref} className="relative py-28 px-6 sm:px-10 bg-[#060b17] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-green-500/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="section-divider mb-px" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            className="inline-flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-full mb-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.5 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Step 1 — Farm
          </motion.span>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mt-4 leading-tight"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
          >
            From Field to{" "}
            <span className="gradient-text">Intelligence</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-base sm:text-lg mt-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
          >
            Watch the AgriShift AI satellite scan your farm in real time — detecting crop health, moisture, and field boundaries.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          {/* Farm Map */}
          <motion.div
            className="lg:col-span-3 relative"
            initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="relative w-full aspect-[4/3] glass-card rounded-3xl overflow-hidden border border-white/10">
              {/* Grid overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4ade80" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Farm base (gradient land) */}
              <div className="absolute inset-4 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-green-900/40 to-teal-900/50 rounded-2xl" />

                {/* Field zones */}
                {zones.map((z) => (
                  <div
                    key={z.id}
                    className="absolute cursor-pointer transition-all duration-300"
                    style={{ left: z.x, top: z.y, width: z.w, height: z.h }}
                    onMouseEnter={() => setHoveredZone(z.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  >
                    {/* Zone fill */}
                    <div
                      className="absolute inset-0 rounded-xl transition-all duration-300"
                      style={{
                        background: `${z.color}${hoveredZone === z.id ? "40" : "20"}`,
                        border: `1.5px solid ${z.color}${hoveredZone === z.id ? "cc" : "50"}`,
                        boxShadow: phase !== "idle" || hoveredZone === z.id ? `0 0 20px ${z.color}30` : "none",
                      }}
                    />

                    {/* Scan glow ring */}
                    <AnimatePresence>
                      {phase === "scanning" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          style={{ border: `2px solid ${z.color}` }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Zone label */}
                    <span className="absolute top-2 left-3 text-xs font-bold" style={{ color: z.color }}>
                      Zone {z.id}
                    </span>

                    {/* Hover tooltip */}
                    <AnimatePresence>
                      {hoveredZone === z.id && (
                        <motion.div
                          className="absolute -top-20 left-1/2 -translate-x-1/2 glass-card border border-white/20 rounded-xl px-3 py-2 text-xs whitespace-nowrap z-20"
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="text-white font-semibold mb-0.5">Zone {z.id}</p>
                          <p className="text-green-400">Vegetation: {z.health}%</p>
                          <p className="text-blue-400">Moisture: {z.moisture}%</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Farm marker */}
                <motion.div
                  className="absolute bottom-4 right-6 flex items-center gap-1.5"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <MapPin className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-300 font-semibold">Demo Farm — 120 acres</span>
                </motion.div>

                {/* Scanning beam */}
                <AnimatePresence>
                  {phase === "scanning" && (
                    <motion.div
                      className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 3.5, ease: "linear" }}
                    />
                  )}
                </AnimatePresence>

                {/* Done checkmark */}
                <AnimatePresence>
                  {phase === "done" && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="flex flex-col items-center gap-3"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <CheckCircle2 className="w-16 h-16 text-green-400" />
                        <span className="text-green-300 font-bold text-lg">Satellite Observation Complete</span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Corner label */}
              <div className="absolute top-3 left-3 text-[10px] font-mono text-green-400/60">
                AGRISHIFT-SCAN v2.4 | NDVI MODE
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] text-cyan-400/60 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                LIVE
              </div>
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div
            className="lg:col-span-2 flex flex-col gap-6"
            initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.4 }}
          >
            {/* Progress card */}
            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radar className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-white text-sm">Scan Progress</span>
                </div>
                <span className="text-2xl font-bold gradient-text-warm">{progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-cyan-400 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Step list */}
              <div className="flex flex-col gap-2">
                {SCAN_STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                      i < stepIdx ? "text-green-400" : i === stepIdx && phase === "scanning" ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {i < stepIdx ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : i === stepIdx && phase === "scanning" ? (
                      <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                    ) : (
                      <span className="w-3.5 h-3.5 shrink-0 rounded-full border border-gray-700" />
                    )}
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action button */}
            {phase === "idle" && (
              <motion.button
                type="button"
                onClick={startScan}
                className="w-full py-4 rounded-2xl font-bold text-black bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-xl shadow-green-500/30 hover:shadow-green-400/50 hover:scale-[1.02] transition-all duration-300 text-base"
                whileTap={{ scale: 0.98 }}
              >
                🛰 Start Farm Scan
              </motion.button>
            )}
            {phase === "scanning" && (
              <div className="w-full py-4 rounded-2xl font-bold text-gray-400 bg-white/5 border border-white/10 text-center text-base cursor-not-allowed">
                Scanning Farm...
              </div>
            )}
            {phase === "done" && (
              <div className="flex flex-col gap-3">
                <a
                  href="#satellite-simulation"
                  className="w-full py-4 rounded-2xl font-bold text-black bg-gradient-to-r from-green-500 to-emerald-500 text-center hover:scale-[1.02] transition-all duration-300 text-base"
                >
                  View Satellite Data →
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="w-full py-3 rounded-2xl font-medium text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
                >
                  Reset Scan
                </button>
              </div>
            )}

            {/* Zone legend */}
            <div className="grid grid-cols-2 gap-3">
              {zones.map((z) => (
                <div key={z.id} className="glass-card rounded-xl p-3 border border-white/8">
                  <p className="text-[11px] font-bold mb-1" style={{ color: z.color }}>Zone {z.id}</p>
                  <p className="text-[10px] text-gray-400">Health: {z.health}%</p>
                  <div className="w-full h-1 bg-white/8 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.health}%`, background: z.color }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
