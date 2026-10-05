import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Compass,
  Satellite,
  Thermometer,
  CloudRain,
  Droplets,
  Sun,
  Wind,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Info,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";

// Fix default leaflet icons in case standard marker is ever used
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Primary Bangladesh agricultural monitoring zones
export const BANGLADESH_DISTRICTS = [
  {
    id: "bogura",
    name: "Bogura",
    division: "Rajshahi",
    lat: 24.8465,
    lon: 89.3773,
    tag: "Central Hub",
    zone: "Karatoya & Jamuna Basin",
    crops: "Boro Rice, Potato, Mustard, Vegetables",
  },
  {
    id: "rangpur",
    name: "Rangpur",
    division: "Rangpur",
    lat: 25.7439,
    lon: 89.2752,
    tag: "Tista Basin",
    zone: "Tista River Floodplain",
    crops: "Aman Rice, Maize, Potato, Tobacco, Wheat",
  },
  {
    id: "dinajpur",
    name: "Dinajpur",
    division: "Rangpur",
    lat: 25.6279,
    lon: 88.6338,
    tag: "Piedmont Plains",
    zone: "Northern Himalayan Plain",
    crops: "Aromatic Rice (Kataribhog), Wheat, Maize, Litchi",
  },
  {
    id: "rajshahi",
    name: "Rajshahi",
    division: "Rajshahi",
    lat: 24.3636,
    lon: 88.6241,
    tag: "High Barind",
    zone: "Barind Tract (Drought-Prone)",
    crops: "Wheat, Mango, Boro Rice (AWD), Pulses",
  },
  {
    id: "sylhet",
    name: "Sylhet",
    division: "Sylhet",
    lat: 24.8949,
    lon: 91.8687,
    tag: "Surma Basin",
    zone: "Northeastern Wetlands / Haor",
    crops: "Tea, Boro Rice (Flash-Flood Prone), Citrus",
  },
];

// Bangladesh bounding box & center
const BANGLADESH_CENTER = [24.55, 89.85];
const DEFAULT_ZOOM = 7.5;
const BANGLADESH_BOUNDS = [
  [20.5, 87.8], // Southwest
  [26.8, 92.9], // Northeast
];

// Helper: Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Find closest monitoring district
function getClosestDistrict(lat, lon) {
  let closest = BANGLADESH_DISTRICTS[0];
  let minDist = Infinity;
  for (const d of BANGLADESH_DISTRICTS) {
    const dist = calculateDistance(lat, lon, d.lat, d.lon);
    if (dist < minDist) {
      minDist = dist;
      closest = d;
    }
  }
  return { ...closest, distanceKm: minDist };
}

// Custom pulsing Leaflet Pin
function createPulsingMarker(label, isSelected = false) {
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        ${
          isSelected
            ? `<div style="position: absolute; top: -4px; width: 36px; height: 36px; border-radius: 9999px; background: rgba(52, 211, 153, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ""
        }
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${
            isSelected
              ? "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
              : "#0f172a"
          };
          border: 2px solid ${isSelected ? "#ffffff" : "#10b981"};
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
          color: ${isSelected ? "#000000" : "#34d399"};
          font-size: 14px;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div style="
          margin-top: 4px;
          white-space: nowrap;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          font-family: monospace;
          background: rgba(6, 11, 23, 0.9);
          color: #a7f3d0;
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 2px 6px rgba(0,0,0,0.6);
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
  });
}

// Subcomponent: Map click listener
function MapClickListener({ onMapClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

// Subcomponent: Map controller for flying to locations
function MapFlyController({ targetCoords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, zoom || 9.5, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [targetCoords, zoom, map]);
  return null;
}

export default function FarmMap({
  onApplyToDashboard,
  onApplyToCrops,
  embedded = false,
  selectedCoords: externalCoords = null,
  onLocationSelect = null,
}) {
  // Selected location state
  const [selectedCoords, setSelectedCoords] = useState({
    lat: 24.8465,
    lon: 89.3773,
    label: "Bogura Farm",
    isCustom: false,
    districtId: "bogura",
  });

  const [flyTarget, setFlyTarget] = useState(null);
  const [mapTileTheme, setMapTileTheme] = useState("cartoDark"); // "osm" | "cartoDark"

  // Sync with external coordinates if provided (e.g. from Farm selector or Dashboard)
  useEffect(() => {
    if (externalCoords && externalCoords.lat != null && externalCoords.lon != null) {
      setSelectedCoords((prev) => {
        if (
          Math.abs(prev.lat - externalCoords.lat) < 0.0001 &&
          Math.abs(prev.lon - externalCoords.lon) < 0.0001
        ) {
          return prev;
        }
        return {
          lat: externalCoords.lat,
          lon: externalCoords.lon,
          label: externalCoords.label || "Target Farm",
          isCustom: externalCoords.isCustom ?? false,
          districtId: externalCoords.districtId || prev.districtId,
        };
      });
      setManualLat(externalCoords.lat.toFixed(4));
      setManualLon(externalCoords.lon.toFixed(4));
      setFlyTarget([externalCoords.lat, externalCoords.lon]);
    }
  }, [externalCoords]);

  // Manual inputs for direct coordinates
  const [manualLat, setManualLat] = useState("24.8465");
  const [manualLon, setManualLon] = useState("89.3773");
  const [coordError, setCoordError] = useState(null);

  // Climate telemetry state
  const [climateSummary, setClimateSummary] = useState(null);
  const [climateDataRaw, setClimateDataRaw] = useState(null);
  const [loadingClimate, setLoadingClimate] = useState(false);
  const [climateError, setClimateError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Toast / sync feedback
  const [syncNotice, setSyncNotice] = useState(null);

  // Fetch NASA climate data for the selected location (by coordinates or district)
  const fetchClimateForLocation = useCallback(async (lat, lon, districtName) => {
    setLoadingClimate(true);
    setClimateError(null);
    try {
      // Use coordinate-based NASA lookup
      const res = await api.getClimateData({
        lat,
        lon,
      });
      setClimateDataRaw(res);
      setClimateSummary(res.summary || {});
      setLastFetched(new Date());
    } catch (err) {
      console.error("NASA climate coordinate lookup failed:", err);
      setClimateError(err.message || "Failed to retrieve NASA POWER climate telemetry.");
    } finally {
      setLoadingClimate(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchClimateForLocation(selectedCoords.lat, selectedCoords.lon, selectedCoords.districtId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle district selection button click
  const handleSelectDistrict = (district) => {
    const lat = district.lat;
    const lon = district.lon;
    setSelectedCoords({
      lat,
      lon,
      label: `${district.name} Station`,
      isCustom: false,
      districtId: district.id,
    });
    setManualLat(lat.toFixed(4));
    setManualLon(lon.toFixed(4));
    setFlyTarget([lat, lon]);
    setCoordError(null);
    fetchClimateForLocation(lat, lon, district.id);
    if (onLocationSelect) {
      onLocationSelect({
        lat,
        lon,
        label: `${district.name} Station`,
        isCustom: false,
        districtId: district.id,
      });
    }
  };

  // Handle map click
  const handleMapClick = (lat, lng) => {
    // Validate bounds
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCoordError("Clicked coordinates are outside valid geographic bounds.");
      return;
    }
    const cleanLat = Math.round(lat * 10000) / 10000;
    const cleanLon = Math.round(lng * 10000) / 10000;
    const nearest = getClosestDistrict(cleanLat, cleanLon);

    const newCoords = {
      lat: cleanLat,
      lon: cleanLon,
      label: `Farm (${cleanLat.toFixed(2)}°, ${cleanLon.toFixed(2)}°)`,
      isCustom: true,
      districtId: nearest.id,
      nearestDistrict: nearest.name,
      distanceKm: nearest.distanceKm,
    };

    setSelectedCoords(newCoords);
    setManualLat(cleanLat.toFixed(4));
    setManualLon(cleanLon.toFixed(4));
    setCoordError(null);
    fetchClimateForLocation(cleanLat, cleanLon, nearest.id);
    if (onLocationSelect) {
      onLocationSelect(newCoords);
    }
  };

  // Handle manual coordinate input submit
  const handleManualCoordSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      setCoordError("Please provide valid numerical coordinates for Latitude and Longitude.");
      return;
    }
    if (lat < -90 || lat > 90) {
      setCoordError("Latitude must be between -90.0 and +90.0°.");
      return;
    }
    if (lon < -180 || lon > 180) {
      setCoordError("Longitude must be between -180.0 and +180.0°.");
      return;
    }

    const cleanLat = Math.round(lat * 10000) / 10000;
    const cleanLon = Math.round(lon * 10000) / 10000;
    const nearest = getClosestDistrict(cleanLat, cleanLon);

    const newCoords = {
      lat: cleanLat,
      lon: cleanLon,
      label: `Point (${cleanLat.toFixed(2)}°, ${cleanLon.toFixed(2)}°)`,
      isCustom: true,
      districtId: nearest.id,
      nearestDistrict: nearest.name,
      distanceKm: nearest.distanceKm,
    };

    setSelectedCoords(newCoords);
    setFlyTarget([cleanLat, cleanLon]);
    setCoordError(null);
    fetchClimateForLocation(cleanLat, cleanLon, nearest.id);
    if (onLocationSelect) {
      onLocationSelect(newCoords);
    }
  };

  // Sync / update Dashboard action
  const handleUpdateDashboard = () => {
    const payload = {
      district: selectedCoords.districtId,
      lat: selectedCoords.lat,
      lon: selectedCoords.lon,
      label: selectedCoords.label,
      climateData: climateDataRaw,
      summary: climateSummary,
    };

    // Prop callback
    if (onApplyToDashboard) {
      onApplyToDashboard(payload);
    }

    // Custom window event for global integration
    window.dispatchEvent(
      new CustomEvent("agrishift:load-climate-location", {
        detail: payload,
      })
    );

    setSyncNotice("Climate Dashboard updated with coordinates.");
    setTimeout(() => setSyncNotice(null), 4000);

    // Scroll to dashboard
    const el = document.getElementById("climate-dashboard");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Sync / update Crop Recommendations action
  const handleUpdateCropRecommendations = () => {
    const s = climateSummary || {};
    const payload = {
      locationName: selectedCoords.isCustom
        ? `Farm (${selectedCoords.lat}°N, ${selectedCoords.lon}°E)`
        : selectedCoords.label,
      district: selectedCoords.districtId,
      lat: selectedCoords.lat,
      lon: selectedCoords.lon,
      temp_avg: s.avg_temperature != null ? s.avg_temperature : 28.5,
      precipitation: s.total_precipitation != null ? Math.round(s.total_precipitation / 14) : 10.0,
      humidity: s.avg_humidity != null ? s.avg_humidity : 82.0,
      soil_moisture:
        s.avg_soil_moisture != null
          ? s.avg_soil_moisture > 1
            ? s.avg_soil_moisture
            : s.avg_soil_moisture * 100
          : 70.0,
      solar_rad: s.avg_solar_radiation != null ? s.avg_solar_radiation : 15.5,
      wind_speed: s.avg_wind_speed != null ? s.avg_wind_speed : 1.5,
    };

    if (onApplyToCrops) {
      onApplyToCrops(payload);
    }

    window.dispatchEvent(
      new CustomEvent("agrishift:load-crop-location", {
        detail: payload,
      })
    );

    setSyncNotice("Crop Ranking Engine updated with NASA telemetry.");
    setTimeout(() => setSyncNotice(null), 4000);

    const el = document.getElementById("crop-ranking");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Nearest district info
  const nearestInfo = getClosestDistrict(selectedCoords.lat, selectedCoords.lon);

  // Embedded view for the Unified Application Dashboard
  if (embedded) {
    return (
      <div id="farm-map" className="rounded-3xl bg-slate-900/90 border border-white/10 overflow-hidden shadow-2xl relative flex flex-col">
        {/* Map Header Overlay Bar */}
        <div className="p-4 bg-slate-950/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {selectedCoords.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              {selectedCoords.isCustom ? "Custom Pin" : "Station Hub"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-mono text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              {selectedCoords.lat.toFixed(4)}°N, {selectedCoords.lon.toFixed(4)}°E
            </div>
            <button
              type="button"
              onClick={() => setMapTileTheme((t) => (t === "cartoDark" ? "osm" : "cartoDark"))}
              className="text-[10px] px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 transition cursor-pointer"
              title="Toggle Tile Style"
            >
              {mapTileTheme === "cartoDark" ? "🛰️ Dark" : "🗺️ OSM"}
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="h-[360px] sm:h-[400px] w-full relative z-0">
          <MapContainer
            center={BANGLADESH_CENTER}
            zoom={DEFAULT_ZOOM}
            minZoom={6}
            maxZoom={14}
            maxBounds={BANGLADESH_BOUNDS}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ background: "#080e1a" }}
          >
            <MapFlyController targetCoords={flyTarget} />
            <MapClickListener onMapClick={handleMapClick} />
            {mapTileTheme === "cartoDark" ? (
              <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />
            ) : (
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            )}
            {BANGLADESH_DISTRICTS.map((dist) => {
              const isCur = !selectedCoords.isCustom && selectedCoords.districtId === dist.id;
              return (
                <Marker
                  key={dist.id}
                  position={[dist.lat, dist.lon]}
                  icon={createPulsingMarker(dist.name, isCur)}
                  eventHandlers={{ click: () => handleSelectDistrict(dist) }}
                >
                  <Popup>
                    <div className="p-1.5 text-slate-900 text-xs">
                      <div className="font-bold text-emerald-800">{dist.name} Station</div>
                      <div className="text-[10px] text-slate-600">{dist.zone}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-1">Crops: {dist.crops}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {selectedCoords.isCustom && (
              <>
                <Marker
                  position={[selectedCoords.lat, selectedCoords.lon]}
                  icon={createPulsingMarker(selectedCoords.label || "Farm Pin", true)}
                />
                <Circle
                  center={[selectedCoords.lat, selectedCoords.lon]}
                  radius={12000}
                  pathOptions={{
                    color: "#10b981",
                    fillColor: "#06b6d4",
                    fillOpacity: 0.1,
                    weight: 1.5,
                    dashArray: "4, 6",
                  }}
                />
              </>
            )}
          </MapContainer>
        </div>

        {/* GPS bar footer */}
        <div className="p-3 bg-slate-950/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <form onSubmit={handleManualCoordSubmit} className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px] font-mono">GPS:</span>
            <input
              type="text"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Lat"
              className="w-20 bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <input
              type="text"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              placeholder="Lon"
              className="w-20 bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer"
            >
              Pinpoint
            </button>
          </form>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Click map to sample coordinates</span>
            <button
              type="button"
              onClick={() => setFlyTarget(BANGLADESH_CENTER)}
              className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              Reset Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      id="farm-map"
      className="relative py-20 px-4 sm:px-6 lg:px-12 bg-[#060b17] text-white border-t border-white/5 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/3 left-1/4 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-blue-600/8 rounded-full blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-sm shadow-emerald-500/10">
              <Navigation className="w-3.5 h-3.5 animate-pulse" />
              GIS Agroclimatology & Location Intelligence
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
            >
              Interactive <span className="gradient-text">Farm Location Map</span>
            </h2>
            <p className="mt-2 text-gray-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              Pinpoint your agricultural parcel in Bangladesh. Select a primary district or click
              directly on the OpenStreetMap canvas to capture precise coordinates and query
              real-time NASA POWER climate telemetry.
            </p>
          </div>

          {/* Map theme / status */}
          <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-900/90 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setMapTileTheme("cartoDark")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                mapTileTheme === "cartoDark"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🛰️ Dark Map
            </button>
            <button
              type="button"
              onClick={() => setMapTileTheme("osm")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                mapTileTheme === "osm"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🗺️ Standard OSM
            </button>
          </div>
        </div>

        {/* Sync feedback notification banner */}
        {syncNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-fade-in">
            <span className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              {syncNotice}
            </span>
            <span className="text-[11px] font-mono text-emerald-400/80">Synchronized</span>
          </div>
        )}

        {/* District Quick-Selection Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl mb-6 shadow-xl shadow-black/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Primary Agricultural Stations (North Bengal & Regional Belt):
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              Click a district button or tap the map to place custom pin
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {BANGLADESH_DISTRICTS.map((dist) => {
              const isActive =
                !selectedCoords.isCustom && selectedCoords.districtId === dist.id;
              return (
                <button
                  key={dist.id}
                  type="button"
                  onClick={() => handleSelectDistrict(dist)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20"
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{dist.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive
                          ? "bg-emerald-400 text-black font-semibold"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {dist.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 truncate">{dist.zone}</div>
                  <div className="text-[10px] font-mono text-emerald-400/80 mt-1">
                    {dist.lat.toFixed(2)}°N, {dist.lon.toFixed(2)}°E
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Interactive Map + Real-time Coordinate Telemetry Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Map Box (Leaflet / OpenStreetMap) */}
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl bg-slate-900/90 border border-white/10 overflow-hidden shadow-2xl relative flex flex-col">
            {/* Map Header Overlay Bar */}
            <div className="p-4 bg-slate-950/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold text-gray-200">
                  Click anywhere on the map to sample coordinates
                </span>
              </div>
              <div className="text-[11px] font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                Lat: {selectedCoords.lat.toFixed(4)}° | Lon: {selectedCoords.lon.toFixed(4)}°
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div className="h-[460px] sm:h-[520px] w-full relative z-0">
              <MapContainer
                center={BANGLADESH_CENTER}
                zoom={DEFAULT_ZOOM}
                minZoom={6}
                maxZoom={14}
                maxBounds={BANGLADESH_BOUNDS}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{
                  background: "#080e1a",
                }}
              >
                <MapFlyController targetCoords={flyTarget} />
                <MapClickListener onMapClick={handleMapClick} />

                {/* Tile Layer: OpenStreetMap or CartoDB Dark Matter */}
                {mapTileTheme === "cartoDark" ? (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={19}
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                )}

                {/* Pre-mapped Bangladesh agricultural district reference markers */}
                {BANGLADESH_DISTRICTS.map((dist) => {
                  const isCur =
                    !selectedCoords.isCustom && selectedCoords.districtId === dist.id;
                  return (
                    <Marker
                      key={dist.id}
                      position={[dist.lat, dist.lon]}
                      icon={createPulsingMarker(dist.name, isCur)}
                      eventHandlers={{
                        click: () => handleSelectDistrict(dist),
                      }}
                    >
                      <Popup className="agrishift-popup">
                        <div className="p-2 text-slate-900">
                          <h4 className="font-bold text-sm text-emerald-800">{dist.name} Station</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{dist.zone}</p>
                          <div className="text-[11px] font-mono text-slate-500 mt-1">
                            Coordinates: {dist.lat}° N, {dist.lon}° E
                          </div>
                          <p className="text-xs text-emerald-700 font-semibold mt-1">
                            Crops: {dist.crops}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSelectDistrict(dist)}
                            className="mt-2 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded w-full cursor-pointer"
                          >
                            Inspect Station Telemetry
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Custom selected location marker if placed anywhere */}
                {selectedCoords.isCustom && (
                  <>
                    <Marker
                      position={[selectedCoords.lat, selectedCoords.lon]}
                      icon={createPulsingMarker("Selected Farm", true)}
                    >
                      <Popup>
                        <div className="p-2 text-slate-900">
                          <h4 className="font-bold text-sm text-cyan-800">Custom Farm Parcel</h4>
                          <p className="text-xs text-slate-600 font-mono mt-0.5">
                            {selectedCoords.lat.toFixed(4)}° N, {selectedCoords.lon.toFixed(4)}° E
                          </p>
                          <p className="text-xs text-slate-700 mt-1">
                            Approx {nearestInfo.distanceKm} km from {nearestInfo.name}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[selectedCoords.lat, selectedCoords.lon]}
                      radius={12000} // 12 km radar radius
                      pathOptions={{
                        color: "#10b981",
                        fillColor: "#06b6d4",
                        fillOpacity: 0.1,
                        weight: 1.5,
                        dashArray: "4, 6",
                      }}
                    />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Map Sub-footer with coordinate quick entry */}
            <div className="p-4 bg-slate-950/90 border-t border-white/10">
              <form
                onSubmit={handleManualCoordSubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                    Direct GPS Entry:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="Lat (e.g. 24.8465)"
                      className="w-24 bg-black/50 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                      title="Latitude"
                    />
                    <span className="text-gray-500">,</span>
                    <input
                      type="text"
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                      placeholder="Lon (e.g. 89.3773)"
                      className="w-24 bg-black/50 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                      title="Longitude"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
                  >
                    Locate GPS Point
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlyTarget(BANGLADESH_CENTER);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 text-xs transition cursor-pointer"
                    title="Reset to Bangladesh center"
                  >
                    Reset View
                  </button>
                </div>
              </form>

              {coordError && (
                <div className="mt-2 text-[11px] text-red-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  {coordError}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Real-time NASA Telemetry for Selected Point */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Active Coordinates Card */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/30">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Selected Geo-Target
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {selectedCoords.label}
                  </h3>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    selectedCoords.isCustom
                      ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {selectedCoords.isCustom ? "Map Point" : "District Hub"}
                </span>
              </div>

              {/* Exact Coordinates Pills */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-black/40 border border-white/8 mb-4 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Latitude</div>
                  <div className="text-white font-bold text-sm mt-0.5">
                    {selectedCoords.lat.toFixed(4)}° N
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Longitude</div>
                  <div className="text-white font-bold text-sm mt-0.5">
                    {selectedCoords.lon.toFixed(4)}° E
                  </div>
                </div>
              </div>

              {/* Proximity / Nearest Station Context */}
              <div className="text-xs text-gray-300 bg-white/5 p-3 rounded-xl border border-white/8 space-y-1 mb-5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Nearest Station:</span>
                  <strong className="text-emerald-400">{nearestInfo.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Station Distance:</span>
                  <span className="text-white font-mono">{nearestInfo.distanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Agro-Ecological Belt:</span>
                  <span className="text-gray-200">{nearestInfo.zone}</span>
                </div>
              </div>

              {/* NASA Telemetry Preview Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-300">
                  <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                  NASA POWER Agroclimate Lookup
                </div>
                <button
                  type="button"
                  onClick={() =>
                    fetchClimateForLocation(
                      selectedCoords.lat,
                      selectedCoords.lon,
                      selectedCoords.districtId
                    )
                  }
                  disabled={loadingClimate}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                  title="Re-query NASA POWER"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingClimate ? "animate-spin text-emerald-400" : ""}`}
                  />
                </button>
              </div>

              {/* Loading State */}
              {loadingClimate && (
                <div className="p-8 text-center bg-black/30 rounded-2xl border border-white/5 space-y-2">
                  <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-300">
                    Querying NASA POWER daily agroclimate dataset for coordinates...
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Lat: {selectedCoords.lat.toFixed(4)}, Lon: {selectedCoords.lon.toFixed(4)}
                  </p>
                </div>
              )}

              {/* Error State */}
              {climateError && !loadingClimate && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  <div className="font-semibold mb-1">NASA Lookup Failed</div>
                  <div>{climateError}</div>
                  <button
                    type="button"
                    onClick={() =>
                      fetchClimateForLocation(
                        selectedCoords.lat,
                        selectedCoords.lon,
                        selectedCoords.districtId
                      )
                    }
                    className="mt-2 text-[11px] underline text-red-200 cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Metrics Display Cards */}
              {!loadingClimate && !climateError && climateSummary && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Temperature */}
                    <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                        Avg Temperature
                      </div>
                      <div className="text-lg font-bold font-mono text-white mt-1">
                        {climateSummary.avg_temperature != null
                          ? `${climateSummary.avg_temperature}°C`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Min: {climateSummary.min_temperature}°C | Max:{" "}
                        {climateSummary.max_temperature}°C
                      </div>
                    </div>

                    {/* Precipitation */}
                    <div className="p-3 rounded-2xl bg-black/40 border border-blue-500/20">
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-300 font-medium">
                        <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                        Total Rainfall
                      </div>
                      <div className="text-lg font-bold font-mono text-white mt-1">
                        {climateSummary.total_precipitation != null
                          ? `${climateSummary.total_precipitation} mm`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">30-day cumulative</div>
                    </div>

                    {/* Soil Moisture */}
                    <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Soil Moisture
                      </div>
                      <div className="text-lg font-bold font-mono text-white mt-1">
                        {climateSummary.avg_soil_moisture != null
                          ? `${(climateSummary.avg_soil_moisture > 1 ? climateSummary.avg_soil_moisture : climateSummary.avg_soil_moisture * 100).toFixed(1)}%`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Root-zone wetness</div>
                    </div>

                    {/* Humidity */}
                    <div className="p-3 rounded-2xl bg-black/40 border border-teal-500/20">
                      <div className="flex items-center gap-1.5 text-[11px] text-teal-300 font-medium">
                        <Droplets className="w-3.5 h-3.5 text-teal-400" />
                        Relative Humidity
                      </div>
                      <div className="text-lg font-bold font-mono text-white mt-1">
                        {climateSummary.avg_humidity != null
                          ? `${climateSummary.avg_humidity}%`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">2-meter ambient</div>
                    </div>
                  </div>

                  {/* Secondary Metrics Bar */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px] text-gray-300 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      Solar:{" "}
                      <strong className="text-white">
                        {climateSummary.avg_solar_radiation != null
                          ? `${climateSummary.avg_solar_radiation} kWh/m²`
                          : "—"}
                      </strong>
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" />
                      Wind:{" "}
                      <strong className="text-white">
                        {climateSummary.avg_wind_speed != null
                          ? `${climateSummary.avg_wind_speed} m/s`
                          : "—"}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons to propagate coordinates/climate to other modules */}
              <div className="mt-5 pt-4 border-t border-white/8 space-y-2.5">
                <button
                  type="button"
                  onClick={handleUpdateDashboard}
                  disabled={loadingClimate || !climateSummary}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sliders className="w-4 h-4" />
                  Load Coordinates into Climate Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleUpdateCropRecommendations}
                  disabled={loadingClimate || !climateSummary}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/8 hover:bg-white/14 border border-white/15 text-gray-200 hover:text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Rank Crops for this Location
                </button>
              </div>

              {/* NASA attribution footnote */}
              {lastFetched && (
                <div className="mt-3 text-[10px] text-gray-400 text-center font-mono">
                  NASA POWER Live Observation • Refreshed at {lastFetched.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
