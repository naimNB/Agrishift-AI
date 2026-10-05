import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BrainCircuit, ArrowDown } from "lucide-react";

const pipeline = [
  { label: "Satellite Data", icon: "🛰", color: "#22d3ee", desc: "Landsat-9 / Sentinel-2 multispectral imagery" },
  { label: "Weather Data", icon: "🌦", color: "#60a5fa", desc: "NASA POWER temperature, rainfall, humidity" },
  { label: "Soil Data", icon: "🪨", color: "#a3e635", desc: "SMAP soil moisture + texture classification" },
  { label: "Crop History", icon: "🌾", color: "#fbbf24", desc: "Previous season rotation and yield records" },
  { label: "AI Analysis", icon: "🧠", color: "#c084fc", desc: "Deep neural network inference & scoring" },
  { label: "Recommendation", icon: "✅", color: "#4ade80", desc: "Optimised crop & irrigation action plan" },
];

export default function AIAnalysis() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="ai-analysis" ref={ref} className="relative py-28 px-6 sm:px-10 bg-[#060b17] overflow-hidden">
      <div className="section-divider mb-px" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(192,132,252,0.05)_0%,transparent_70%)]" />

      {/* Floating particles */}
      {inView && [...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-purple-400/20 pointer-events-none"
          style={{
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{ y: [-20, 20, -20], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            className="inline-flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full mb-4"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Step 5 — AI Analysis
          </motion.span>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mt-4"
            style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
          >
            AI Is Turning Earth Data{" "}
            <span className="gradient-text">Into Decisions</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 mt-4 text-lg"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          >
            Six data streams converge into a single, actionable farm intelligence pipeline.
          </motion.p>
        </div>

        {/* Pipeline */}
        <div className="flex flex-col items-center gap-0 max-w-2xl mx-auto">
          {pipeline.map((step, i) => (
            <div key={step.label} className="w-full flex flex-col items-center">
              <motion.div
                className="w-full glass-card rounded-2xl p-5 border border-white/10 flex items-center gap-5 hover:scale-[1.02] transition-all duration-300 group"
                style={{ borderColor: `${step.color}25` }}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                whileHover={{ boxShadow: `0 0 30px ${step.color}20` }}
              >
                {/* Icon bubble */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
                >
                  {step.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm mb-0.5">{step.label}</p>
                  <p className="text-xs text-gray-400 truncate">{step.desc}</p>
                </div>

                {/* Step number */}
                <span className="text-xs font-mono shrink-0" style={{ color: step.color }}>
                  0{i + 1}
                </span>

                {/* Glow line */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full"
                  style={{ background: step.color }}
                  initial={{ scaleY: 0 }}
                  animate={inView ? { scaleY: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                />
              </motion.div>

              {/* Connector */}
              {i < pipeline.length - 1 && (
                <motion.div
                  className="flex flex-col items-center py-1"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.4 + i * 0.15 }}
                >
                  <motion.div
                    className="w-px bg-gradient-to-b from-white/20 to-transparent"
                    style={{ height: 28 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowDown className="w-4 h-4 text-gray-600" />
                  </motion.div>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom stat row */}
        <motion.div
          className="flex flex-wrap justify-center gap-8 mt-16"
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 1.2 }}
        >
          {[
            { val: "< 2s", label: "Inference Time" },
            { val: "94%", label: "Model Accuracy" },
            { val: "6+", label: "Data Sources" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold gradient-text-warm">{s.val}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}