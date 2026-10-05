import { useState } from "react";
import {
  X,
  Satellite,
  Play,
  Sprout,
  Sparkles,
  FileText,
  PhoneCall,
  TrendingUp,
  Layers,
  Droplets,
  Sun,
  Activity,
  CheckCircle2,
  Globe,
  ArrowRight
} from "lucide-react";

export default function HeroModal({ type, onClose }) {
  const [activeLayer, setActiveLayer] = useState("ndvi");
  const [selectedSoil, setSelectedSoil] = useState("loam");
  const [selectedSeason, setSelectedSeason] = useState("spring");
  const [acres, setAcres] = useState(250);
  const [submittedContact, setSubmittedContact] = useState(false);

  if (!type) return null;

  return (
    <div
      className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      p-4
      sm:p-6
      bg-black/75
      backdrop-blur-md
      animate-fadeIn
      "
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="
        relative
        w-full
        max-w-2xl
        max-h-[90vh]
        overflow-y-auto
        rounded-3xl
        bg-slate-900/95
        border
        border-white/20
        p-6
        sm:p-8
        text-white
        shadow-2xl
        shadow-green-500/10
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="
          absolute
          top-5
          right-5
          p-2
          rounded-full
          bg-white/10
          hover:bg-white/20
          text-gray-300
          hover:text-white
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-green-400
          transition
          "
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content switch */}
        {type === "satellite" && (
          <div>
            <div className="
            flex
            items-center
            gap-3
            text-cyan-400
            mb-2
            ">
              <Satellite className="w-6 h-6 animate-pulse" />
              <span className="
              text-xs
              uppercase
              tracking-widest
              font-bold
              bg-cyan-500/20
              px-3
              py-1
              rounded-full
              border
              border-cyan-500/40
              ">
                NASA Live Telemetry
              </span>
            </div>

            <h3 className="
            text-2xl
            sm:text-3xl
            font-bold
            mt-1
            ">
              Live Satellite Vegetation Map
            </h3>
            <p className="
            text-sm
            text-gray-300
            mt-2
            ">
              Real-time multispectral telemetry from NASA Landsat-9 and Sentinel-2 constellations calibrated for agriculture.
            </p>

            {/* Layer Selector Buttons */}
            <div className="
            flex
            flex-wrap
            gap-2
            mt-6
            ">
              <button
                type="button"
                onClick={() => setActiveLayer("ndvi")}
                className={`
                px-4
                py-2
                rounded-xl
                text-xs
                font-semibold
                flex
                items-center
                gap-1.5
                transition
                border
                ${
                  activeLayer === "ndvi"
                    ? "bg-green-400 text-black border-green-400 shadow-lg shadow-green-400/25"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }
                `}
              >
                <Layers className="w-3.5 h-3.5" />
                NDVI Plant Health
              </button>

              <button
                type="button"
                onClick={() => setActiveLayer("moisture")}
                className={`
                px-4
                py-2
                rounded-xl
                text-xs
                font-semibold
                flex
                items-center
                gap-1.5
                transition
                border
                ${
                  activeLayer === "moisture"
                    ? "bg-blue-400 text-black border-blue-400 shadow-lg shadow-blue-400/25"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }
                `}
              >
                <Droplets className="w-3.5 h-3.5" />
                Soil Moisture (SMAP)
              </button>

              <button
                type="button"
                onClick={() => setActiveLayer("thermal")}
                className={`
                px-4
                py-2
                rounded-xl
                text-xs
                font-semibold
                flex
                items-center
                gap-1.5
                transition
                border
                ${
                  activeLayer === "thermal"
                    ? "bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-400/25"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }
                `}
              >
                <Sun className="w-3.5 h-3.5" />
                Thermal Stress (ECOSTRESS)
              </button>
            </div>

            {/* Satellite View Simulator */}
            <div className="
            mt-5
            p-5
            rounded-2xl
            bg-black/60
            border
            border-cyan-500/30
            relative
            overflow-hidden
            ">
              <div className="
              absolute
              top-3
              left-3
              flex
              items-center
              gap-2
              text-xs
              text-cyan-300
              font-mono
              ">
                <span className="
                w-2
                h-2
                rounded-full
                bg-emerald-400
                animate-ping
                "></span>
                LAT 36.7783° N | LON 119.4179° W
              </div>

              <div className="
              absolute
              top-3
              right-3
              text-xs
              text-gray-400
              font-mono
              ">
                Revisit: 38m ago
              </div>

              <div className="
              grid
              grid-cols-3
              gap-3
              mt-7
              pt-4
              ">
                <div className="
                p-3
                rounded-xl
                bg-white/5
                border
                border-white/10
                ">
                  <div className="text-xs text-gray-400">Mean NDVI Index</div>
                  <div className="text-xl font-bold text-green-400 mt-1">0.82 High</div>
                  <div className="text-[11px] text-gray-400 mt-1">Optimum photosynthesis</div>
                </div>

                <div className="
                p-3
                rounded-xl
                bg-white/5
                border
                border-white/10
                ">
                  <div className="text-xs text-gray-400">Root Zone Moisture</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">34.6%</div>
                  <div className="text-[11px] text-gray-400 mt-1">Adequate saturation</div>
                </div>

                <div className="
                p-3
                rounded-xl
                bg-white/5
                border
                border-white/10
                ">
                  <div className="text-xs text-gray-400">Canopy Temp</div>
                  <div className="text-xl font-bold text-amber-300 mt-1">23.8°C</div>
                  <div className="text-[11px] text-gray-400 mt-1">Zero thermal deficit</div>
                </div>
              </div>

              <div className="
              mt-4
              p-4
              rounded-xl
              bg-gradient-to-r
              from-emerald-950/60
              via-teal-950/50
              to-slate-900/80
              border
              border-emerald-500/30
              flex
              items-center
              justify-between
              ">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs sm:text-sm text-gray-200">
                    Live Anomaly Detection: <strong className="text-emerald-300">All zones healthy</strong>
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">100% sync</span>
              </div>
            </div>

            <div className="
            flex
            justify-end
            gap-3
            mt-6
            ">
              <button
                type="button"
                onClick={onClose}
                className="
                px-5
                py-2.5
                rounded-full
                bg-white/10
                hover:bg-white/20
                text-sm
                font-medium
                transition
                "
              >
                Close View
              </button>
              <button
                type="button"
                onClick={onClose}
                className="
                px-6
                py-2.5
                rounded-full
                bg-cyan-400
                hover:bg-cyan-300
                text-black
                text-sm
                font-bold
                transition
                flex
                items-center
                gap-1.5
                "
              >
                Full Satellite Deck <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {type === "advisory" && (
          <div>
            <div className="
            flex
            items-center
            gap-3
            text-green-400
            mb-2
            ">
              <Sprout className="w-6 h-6" />
              <span className="
              text-xs
              uppercase
              tracking-widest
              font-bold
              bg-green-500/20
              px-3
              py-1
              rounded-full
              border
              border-green-500/40
              ">
                AI Crop Intelligence
              </span>
            </div>

            <h3 className="
            text-2xl
            sm:text-3xl
            font-bold
            mt-1
            ">
              Interactive Crop Recommendation
            </h3>
            <p className="
            text-sm
            text-gray-300
            mt-2
            ">
              Select your field parameters to simulate AgriShift AI recommendations powered by NASA historical rainfall and soil chemistry models.
            </p>

            {/* Controls */}
            <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            gap-4
            mt-6
            ">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-300">
                  Soil Texture Type
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["loam", "clay", "sandy"].map((soil) => (
                    <button
                      key={soil}
                      type="button"
                      onClick={() => setSelectedSoil(soil)}
                      className={`
                      py-2
                      rounded-xl
                      text-xs
                      font-semibold
                      capitalize
                      border
                      transition
                      ${
                        selectedSoil === soil
                          ? "bg-green-400 text-black border-green-400"
                          : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      }
                      `}
                    >
                      {soil}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-300">
                  Target Season
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["spring", "summer", "autumn"].map((season) => (
                    <button
                      key={season}
                      type="button"
                      onClick={() => setSelectedSeason(season)}
                      className={`
                      py-2
                      rounded-xl
                      text-xs
                      font-semibold
                      capitalize
                      border
                      transition
                      ${
                        selectedSeason === season
                          ? "bg-green-400 text-black border-green-400"
                          : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      }
                      `}
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendation Result Card */}
            <div className="
            mt-6
            p-5
            rounded-2xl
            bg-emerald-950/40
            border
            border-emerald-500/40
            ">
              <div className="
              flex
              items-center
              justify-between
              ">
                <div>
                  <span className="
                  text-xs
                  font-bold
                  text-emerald-400
                  uppercase
                  ">
                    Top AI Recommendation
                  </span>
                  <h4 className="
                  text-xl
                  font-bold
                  text-white
                  mt-0.5
                  ">
                    {selectedSoil === "sandy"
                      ? "Drought-Resilient Sorghum (Grain & Silage)"
                      : selectedSoil === "clay"
                      ? "Winter Wheat & High-Yield Barley"
                      : "Regenerative Soybeans & Nitrogen Clover"}
                  </h4>
                </div>
                <div className="
                px-3
                py-1.5
                rounded-xl
                bg-emerald-400/20
                border
                border-emerald-400/40
                text-emerald-300
                text-xs
                font-bold
                ">
                  96.4% Match
                </div>
              </div>

              <div className="
              grid
              grid-cols-3
              gap-3
              mt-4
              pt-4
              border-t
              border-emerald-500/20
              text-center
              ">
                <div>
                  <div className="text-xs text-gray-400">Yield Boost</div>
                  <div className="text-lg font-bold text-green-300 mt-0.5">+24.5%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Water Conservation</div>
                  <div className="text-lg font-bold text-blue-300 mt-0.5">-31% Saved</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Carbon Credit Score</div>
                  <div className="text-lg font-bold text-emerald-300 mt-0.5">Tier 1 Elite</div>
                </div>
              </div>
            </div>

            <div className="
            flex
            justify-end
            gap-3
            mt-6
            ">
              <button
                type="button"
                onClick={onClose}
                className="
                px-6
                py-2.5
                rounded-full
                bg-green-400
                hover:bg-green-300
                text-black
                text-sm
                font-bold
                transition
                "
              >
                Apply To My Fields
              </button>
            </div>
          </div>
        )}

        {type === "video" && (
          <div>
            <div className="
            flex
            items-center
            gap-3
            text-green-400
            mb-2
            ">
              <Play className="w-6 h-6" />
              <span className="
              text-xs
              uppercase
              tracking-widest
              font-bold
              bg-green-500/20
              px-3
              py-1
              rounded-full
              border
              border-green-500/40
              ">
                Product Walkthrough
              </span>
            </div>

            <h3 className="
            text-2xl
            sm:text-3xl
            font-bold
            mt-1
            ">
              How AgriShift AI Transforms Agriculture
            </h3>

            {/* Video mockup frame */}
            <div className="
            mt-6
            rounded-2xl
            bg-black
            border
            border-white/20
            aspect-video
            flex
            flex-col
            items-center
            justify-center
            relative
            overflow-hidden
            group
            ">
              <div className="
              w-16
              h-16
              rounded-full
              bg-green-400
              text-black
              flex
              items-center
              justify-center
              shadow-lg
              shadow-green-400/40
              group-hover:scale-110
              transition
              cursor-pointer
              ">
                <Play className="w-7 h-7 fill-black ml-1" />
              </div>

              <p className="
              mt-4
              text-sm
              text-gray-300
              font-medium
              ">
                3-Minute Executive Tour: From Satellite Orbit to Tractor Cab
              </p>

              <div className="
              absolute
              bottom-3
              left-4
              right-4
              flex
              justify-between
              text-xs
              text-gray-400
              ">
                <span>HD 1080p • NASA Earth Science Partner</span>
                <span>03:14</span>
              </div>
            </div>

            <div className="
            flex
            justify-end
            mt-6
            ">
              <button
                type="button"
                onClick={onClose}
                className="
                px-6
                py-2.5
                rounded-full
                bg-white/10
                hover:bg-white/20
                text-sm
                font-semibold
                transition
                "
              >
                Close Preview
              </button>
            </div>
          </div>
        )}

        {type === "cases" && (
          <div>
            <div className="
            flex
            items-center
            gap-3
            text-blue-400
            mb-2
            ">
              <FileText className="w-6 h-6" />
              <span className="
              text-xs
              uppercase
              tracking-widest
              font-bold
              bg-blue-500/20
              px-3
              py-1
              rounded-full
              border
              border-blue-500/40
              ">
                Field Validations
              </span>
            </div>

            <h3 className="
            text-2xl
            sm:text-3xl
            font-bold
            mt-1
            ">
              Independent Case Studies
            </h3>
            <p className="
            text-sm
            text-gray-300
            mt-2
            ">
              Documented production deployments demonstrating measurable yield increases and climate mitigation.
            </p>

            <div className="
            space-y-3
            mt-6
            ">
              <div className="
              p-4
              rounded-2xl
              bg-white/5
              border
              border-white/10
              hover:border-green-400/40
              transition
              ">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">Central Valley Almond & Citrus Growers</h4>
                    <p className="text-xs text-gray-400 mt-1">California, USA • 1,400 Hectares</p>
                  </div>
                  <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
                    -34% Water Use
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-2">
                  Replaced calendar irrigation with NASA MODIS evapotranspiration mapping, saving 420M gallons during severe drought.
                </p>
              </div>

              <div className="
              p-4
              rounded-2xl
              bg-white/5
              border
              border-white/10
              hover:border-green-400/40
              transition
              ">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">Midwestern Grain & Soybean Collective</h4>
                    <p className="text-xs text-gray-400 mt-1">Iowa, USA • 3,200 Hectares</p>
                  </div>
                  <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
                    +19.2% Yield
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-2">
                  AI crop rotation matched nitrogen demands to soil moisture forecasts, yielding $184/acre in extra profit.
                </p>
              </div>
            </div>

            <div className="
            flex
            justify-end
            mt-6
            ">
              <button
                type="button"
                onClick={onClose}
                className="
                px-6
                py-2.5
                rounded-full
                bg-green-400
                hover:bg-green-300
                text-black
                text-sm
                font-bold
                transition
                "
              >
                Download Whitepaper (PDF)
              </button>
            </div>
          </div>
        )}

        {type === "contact" && (
          <div>
            <div className="
            flex
            items-center
            gap-3
            text-green-400
            mb-2
            ">
              <PhoneCall className="w-6 h-6" />
              <span className="
              text-xs
              uppercase
              tracking-widest
              font-bold
              bg-green-500/20
              px-3
              py-1
              rounded-full
              border
              border-green-500/40
              ">
                Agronomist Advisory
              </span>
            </div>

            <h3 className="
            text-2xl
            sm:text-3xl
            font-bold
            mt-1
            ">
              Connect With an Agronomist
            </h3>
            <p className="
            text-sm
            text-gray-300
            mt-2
            ">
              Schedule a personalized satellite audit of your farm with an AgriShift certified precision agriculture specialist.
            </p>

            {submittedContact ? (
              <div className="
              mt-6
              p-6
              rounded-2xl
              bg-emerald-950/60
              border
              border-emerald-500/40
              text-center
              ">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-lg font-bold text-white">Consultation Request Received!</h4>
                <p className="text-xs text-gray-300 mt-1">
                  Our regional agronomist will contact you within 2 hours with your satellite baseline report.
                </p>
              </div>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmittedContact(true);
                }}
              >
                <div>
                  <label htmlFor="contact-name" className="text-xs font-semibold text-gray-300 block mb-1">
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    required
                    type="text"
                    placeholder="e.g. John Miller"
                    className="
                    w-full
                    p-3.5
                    rounded-xl
                    bg-white/5
                    border
                    border-white/20
                    outline-none
                    focus:border-green-400
                    text-white
                    text-sm
                    "
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-email" className="text-xs font-semibold text-gray-300 block mb-1">
                      Work Email
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      placeholder="john@farm.com"
                      className="
                      w-full
                      p-3.5
                      rounded-xl
                      bg-white/5
                      border
                      border-white/20
                      outline-none
                      focus:border-green-400
                      text-white
                      text-sm
                      "
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-acres" className="text-xs font-semibold text-gray-300 block mb-1">
                      Farm Size (Acres / Hectares)
                    </label>
                    <input
                      id="contact-acres"
                      required
                      type="text"
                      placeholder="e.g. 500 Acres"
                      className="
                      w-full
                      p-3.5
                      rounded-xl
                      bg-white/5
                      border
                      border-white/20
                      outline-none
                      focus:border-green-400
                      text-white
                      text-sm
                      "
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="
                  w-full
                  py-3.5
                  rounded-full
                  bg-green-400
                  hover:bg-green-300
                  text-black
                  font-bold
                  text-sm
                  transition
                  mt-4
                  "
                >
                  Request Free Satellite Audit →
                </button>
              </form>
            )}
          </div>
        )}

        {type === "roi" && (
          <div>
            <div className="
            flex
            items-center
            gap-3
            text-amber-400
            mb-2
            ">
              <TrendingUp className="w-6 h-6" />
              <span className="
              text-xs
              uppercase
              tracking-widest
              font-bold
              bg-amber-500/20
              px-3
              py-1
              rounded-full
              border
              border-amber-500/40
              ">
                Economic Impact Model
              </span>
            </div>

            <h3 className="
            text-2xl
            sm:text-3xl
            font-bold
            mt-1
            ">
              Farm Yield & ROI Calculator
            </h3>
            <p className="
            text-sm
            text-gray-300
            mt-2
            ">
              Slide to your cultivated acreage to see estimated fertilizer reductions, water savings, and net profit gains.
            </p>

            <div className="
            mt-6
            p-5
            rounded-2xl
            bg-white/5
            border
            border-white/10
            ">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase font-bold text-gray-400">Total Cultivated Area</span>
                <span className="text-lg font-bold text-green-400">{acres} Acres</span>
              </div>
              <input
                type="range"
                min="50"
                max="2500"
                step="50"
                value={acres}
                onChange={(e) => setAcres(Number(e.target.value))}
                className="w-full accent-green-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                <span>50 Acres</span>
                <span>1,250 Acres</span>
                <span>2,500+ Acres</span>
              </div>

              <div className="
              grid
              grid-cols-3
              gap-3
              mt-6
              pt-4
              border-t
              border-white/10
              text-center
              ">
                <div>
                  <div className="text-xs text-gray-400">Est. Annual Gain</div>
                  <div className="text-lg sm:text-xl font-bold text-green-400 mt-1">
                    ${(acres * 138).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Water Conserved</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-400 mt-1">
                    {(acres * 45).toLocaleString()} kGal
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Nitrogen Optimization</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-300 mt-1">
                    -26%
                  </div>
                </div>
              </div>
            </div>

            <div className="
            flex
            justify-end
            gap-3
            mt-6
            ">
              <button
                type="button"
                onClick={onClose}
                className="
                px-6
                py-2.5
                rounded-full
                bg-green-400
                hover:bg-green-300
                text-black
                text-sm
                font-bold
                transition
                "
              >
                Generate Detailed Farm Audit
              </button>
            </div>
          </div>
        )}

        {type === "specs" && (
          <div>
            <div className="
            flex
            items-center
            gap-3
            text-blue-400
            mb-2
            ">
              <Globe className="w-6 h-6" />
              <span className="
              text-xs
              uppercase
              tracking-widest
              font-bold
              bg-blue-500/20
              px-3
              py-1
              rounded-full
              border
              border-blue-500/40
              ">
                NASA Earth Science
              </span>
            </div>

            <h3 className="
            text-2xl
            sm:text-3xl
            font-bold
            mt-1
            ">
              NASA Satellite Ingestion Specs
            </h3>

            <div className="space-y-3 mt-6">
              {[
                { name: "Landsat-8 & Landsat-9 (OLI/TIRS)", specs: "15m Panchromatic, 30m Multispectral, 8-day combined cadence" },
                { name: "Sentinel-2 (Copernicus / NASA Access)", specs: "10m Spatial Resolution across 13 spectral bands" },
                { name: "SMAP (Soil Moisture Active Passive)", specs: "Top 5cm soil moisture & freeze/thaw state mapping" },
                { name: "MODIS (Terra & Aqua)", specs: "Daily vegetative indices, thermal anomalies, & global snow/ice cover" }
              ].map((sat) => (
                <div
                  key={sat.name}
                  className="
                  p-3.5
                  rounded-xl
                  bg-white/5
                  border
                  border-white/10
                  "
                >
                  <div className="font-semibold text-sm text-cyan-300">{sat.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{sat.specs}</div>
                </div>
              ))}
            </div>

            <div className="
            flex
            justify-end
            mt-6
            ">
              <button
                type="button"
                onClick={onClose}
                className="
                px-6
                py-2.5
                rounded-full
                bg-cyan-400
                hover:bg-cyan-300
                text-black
                text-sm
                font-bold
                transition
                "
              >
                Close Specs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
