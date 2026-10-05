import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Sprout, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { predictCrops } from "../services/predictionService";

const soilTypes = ["Loam", "Clay", "Sandy"];
const seasons = ["Rabi", "Spring", "Summer"];
const irrigationOpts = ["Low", "Moderate", "High"];
const prevCrops = ["Rice", "Wheat", "Maize", "Jute", "Mustard"];

export default function CropRecommendation() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const [form, setForm] = useState({
    location: "Bogura, Bangladesh",
    soil: "Loam",
    season: "Rabi",
    irrigation: "Moderate",
    prevCrop: "Rice",
  });
  const [phase, setPhase] = useState("idle"); // idle | thinking | done
  const [results, setResults] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    if (phase !== "idle") return;
    setPhase("thinking");
    setResults(null);
    try {
      const data = await predictCrops({ soilType: form.soil, season: form.season });
      setResults(data);
    } finally {
      setPhase("done");
    }
  };

  const reset = () => { setPhase("idle"); setResults(null); };

  const suitColor = (s) => s >= 85 ? "#4ade80" : s >= 75 ? "#fbbf24" : "#fb923c";

  return (
    <section id="crop-recommendation" ref={ref} className="relative py-28 px-6 sm:px-10 bg-[#050a15] overflow-hidden">
      <div className="section-divider mb-px" />
      <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-green-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            className="inline-flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-full mb-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          >
            <Sprout className="w-3.5 h-3.5" />
            Step 6 — Crop Recommendation
          </motion.span>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mt-4"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
          >
            AI Crop <span className="gradient-text">Recommendation</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 mt-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          >
            Enter your farm parameters and let the AI determine the optimal crop choices.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form */}
          <motion.div
            className="glass-card rounded-3xl p-8 border border-white/10"
            initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Location */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => set("location", e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-green-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200"
              />
            </div>

            {/* Dropdowns */}
            {[
              { label: "Soil Type", key: "soil", opts: soilTypes },
              { label: "Season", key: "season", opts: seasons },
              { label: "Irrigation", key: "irrigation", opts: irrigationOpts },
              { label: "Previous Crop", key: "prevCrop", opts: prevCrops },
            ].map(({ label, key, opts }) => (
              <div key={key} className="mb-5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</label>
                <div className="relative">
                  <select
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-green-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none appearance-none cursor-pointer transition-all duration-200"
                  >
                    {opts.map(o => <option key={o} value={o} className="bg-[#0b1220]">{o}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            ))}

            {/* Action */}
            {phase === "idle" && (
              <button
                type="button"
                onClick={generate}
                className="w-full py-4 rounded-2xl font-bold text-black bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-xl shadow-green-500/30 hover:scale-[1.02] transition-all duration-300 text-base mt-2"
              >
                🌱 Generate Recommendation
              </button>
            )}
            {phase === "thinking" && (
              <div className="w-full py-4 rounded-2xl font-medium text-gray-300 bg-white/5 border border-white/10 flex items-center justify-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysing environmental conditions...
              </div>
            )}
            {phase === "done" && (
              <button
                type="button"
                onClick={reset}
                className="w-full py-3 rounded-2xl font-medium text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all mt-2"
              >
                Reset
              </button>
            )}
          </motion.div>

          {/* Results */}
          <motion.div
            className="flex flex-col gap-5"
            initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Disclaimer */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                <strong>Demo Simulation</strong> — Model not connected yet. Results are pre-computed for illustration.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {phase === "thinking" && (
                <motion.div
                  key="loading"
                  className="flex-1 glass-card rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center gap-4 min-h-[300px]"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-20 h-20 rounded-full border-4 border-green-500/20 border-t-green-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-gray-400 text-sm font-medium">Running AI inference...</p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-green-400"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {phase === "done" && results && (
                <motion.div
                  key="results"
                  className="flex flex-col gap-4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div className="glass-card rounded-3xl p-6 border border-green-500/20">
                    <p className="text-sm font-bold text-green-400 mb-4">Recommended Crops</p>
                    <div className="flex flex-col gap-4">
                      {results.crops.map((crop, i) => (
                        <motion.div
                          key={crop.name}
                          className="flex items-center gap-4"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 }}
                        >
                          <span className="text-2xl font-bold text-gray-600 w-6 shrink-0">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="font-semibold text-white text-sm">{crop.name}</p>
                              <span className="text-sm font-bold" style={{ color: suitColor(crop.suit) }}>
                                {crop.suit}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: suitColor(crop.suit) }}
                                initial={{ width: 0 }}
                                animate={{ width: `${crop.suit}%` }}
                                transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                              />
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">Suitability score</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-4 border border-white/8 text-xs text-gray-500 flex items-center gap-2">
                    <Sprout className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    Based on: {form.soil} soil · {form.season} season · {form.prevCrop} rotation
                  </div>
                </motion.div>
              )}

              {phase === "idle" && (
                <motion.div
                  key="idle"
                  className="flex-1 glass-card rounded-3xl p-8 border border-white/8 flex flex-col items-center justify-center gap-3 min-h-[300px]"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <Sprout className="w-12 h-12 text-gray-700" />
                  <p className="text-gray-500 text-sm">Configure your farm and click Generate</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
