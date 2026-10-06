import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClimateRisk from "../components/ClimateRisk";
import CropRecommendation from "../components/CropRecommendation";
import ClimateDashboard from "../components/ClimateDashboard";
import Navbar from "../components/Navbar";
import MyFarmManager from "../components/MyFarmManager";
import Hero from "../components/Hero";
import Features from "../components/Features";
import NasaData from "../components/NasaData";
import HowItWorks from "../components/HowItWorks";
import About from "../components/About";
import { AuthProvider } from "../context/AuthContext";
import { api } from "../services/api";

// Mock the API service
vi.mock("../services/api", () => ({
  api: {
    getClimateRisk: vi.fn(),
    rankCrops: vi.fn(),
    getClimateData: vi.fn(),
    getFarmerAdvisories: vi.fn(),
    getClimateSummary: vi.fn().mockResolvedValue({ summary: {} }),
    getFarms: vi.fn(),
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  TOKEN_STORAGE_KEY: "agrishift_auth_token",
}));

// Mock react-leaflet / leaflet components to prevent jsdom canvas / leaflet issues
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="mock-map-container">{children}</div>,
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: ({ children }) => <div data-testid="mock-marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="mock-popup">{children}</div>,
  Circle: () => <div data-testid="mock-circle" />,
  useMap: () => ({ flyTo: vi.fn() }),
  useMapEvents: () => ({}),
}));

vi.mock("leaflet", () => {
  const Default = function () {};
  Default.prototype._getIconUrl = "";
  return {
    default: {
      Icon: {
        Default: {
          prototype: { _getIconUrl: "" },
          mergeOptions: vi.fn(),
        },
      },
      divIcon: vi.fn(() => ({})),
    },
  };
});

describe("Component Automated Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. ClimateRisk Component", () => {
    it("should render loading state initially", () => {
      // Return a pending promise
      api.getClimateRisk.mockImplementation(() => new Promise(() => {}));

      render(<ClimateRisk selectedDistrict="bogura" embedded={true} />);

      // Verify component has loading indicators
      expect(screen.getByText(/Climate Risk Intelligence/i)).toBeInTheDocument();
      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("should render error state when API fails", async () => {
      api.getClimateRisk.mockRejectedValue(new Error("Climate risk calculation server error"));

      render(<ClimateRisk selectedDistrict="bogura" embedded={true} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Climate risk calculation server error/i)
        ).toBeInTheDocument();
      });
    });

    it("should render the 3 climate risk cards (Drought, Flood, Heat Stress) with scores and actions", async () => {
      const mockRiskResponse = {
        location: "bogura",
        overall_risk_level: "moderate",
        risks: [
          {
            risk_type: "drought",
            name: "Drought Hazard",
            level: "moderate",
            score_percent: 62,
            explanation: "Low root-zone moisture deficit observed in Karatoya basin.",
            recommended_action: "Schedule light irrigation before soil tension increases.",
            contributing_variables: { soil_moisture: "0.22 index", dry_days: "6 days" },
          },
          {
            risk_type: "flood",
            name: "Flood / Excess Rainfall Hazard",
            level: "low",
            score_percent: 15,
            explanation: "Precipitation within safe percolation capacity.",
            recommended_action: "Maintain drainage outlets clean.",
            contributing_variables: { total_rainfall_7d: "18 mm" },
          },
          {
            risk_type: "heat_stress",
            name: "Heat Stress Hazard",
            level: "low",
            score_percent: 28,
            explanation: "Daytime temperatures below anthesis damage threshold.",
            recommended_action: "Monitor midday canopy temperature.",
            contributing_variables: { max_temp: "32.5°C" },
          },
        ],
      };

      api.getClimateRisk.mockResolvedValue(mockRiskResponse);

      render(<ClimateRisk selectedDistrict="bogura" embedded={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Drought Hazard/i)).toBeInTheDocument();
        expect(screen.getByText(/Flood \/ Excess Rainfall Hazard/i)).toBeInTheDocument();
        expect(screen.getByText(/Heat Stress Hazard/i)).toBeInTheDocument();
      });

      // Verify scores are rendered
      expect(screen.getByText("62%")).toBeInTheDocument();
      expect(screen.getByText("15%")).toBeInTheDocument();
      expect(screen.getByText("28%")).toBeInTheDocument();

      // Verify recommended action is rendered
      expect(
        screen.getByText(/Schedule light irrigation before soil tension increases/i)
      ).toBeInTheDocument();
    });
  });

  describe("2. CropRecommendation Component", () => {
    it("should render loading state initially", () => {
      api.rankCrops.mockImplementation(() => new Promise(() => {}));

      render(<CropRecommendation selectedDistrict="bogura" embedded={true} />);

      expect(screen.getByText(/Crop Suitability Ranking/i)).toBeInTheDocument();
      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("should render error state when ranking fails", async () => {
      api.rankCrops.mockRejectedValue(new Error("Unable to rank crops: ML engine unavailable"));

      render(<CropRecommendation selectedDistrict="bogura" embedded={true} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to rank crops: ML engine unavailable/i)
        ).toBeInTheDocument();
      });
    });

    it("should render ranked candidate crops with scores, rank badges, and factor suitability", async () => {
      const mockRankingResponse = {
        location: "bogura",
        engine_name: "Bangladesh AEZ Agronomic Rules",
        is_ai_model: false,
        recommendations: [
          {
            crop: "rice",
            rank: 1,
            score: 0.92,
            reasoning: ["Optimal temperature and high soil moisture support Boro rice."],
            factor_scores: {
              temp_suitability: 94,
              rain_suitability: 88,
              humidity_suitability: 92,
              moist_suitability: 95,
            },
          },
          {
            crop: "potato",
            rank: 2,
            score: 0.81,
            reasoning: ["Favorable soil texture and moderate temperatures."],
            factor_scores: {
              temp_suitability: 82,
              rain_suitability: 85,
              humidity_suitability: 78,
              moist_suitability: 80,
            },
          },
          {
            crop: "mustard",
            rank: 3,
            score: 0.74,
            reasoning: ["Moderate moisture acceptable for mustard sowing."],
            factor_scores: {
              temp_suitability: 75,
              rain_suitability: 70,
              humidity_suitability: 72,
              moist_suitability: 76,
            },
          },
        ],
      };

      api.rankCrops.mockResolvedValue(mockRankingResponse);

      render(<CropRecommendation selectedDistrict="bogura" embedded={true} />);

      await waitFor(() => {
        expect(screen.getAllByText(/rice/i).length).toBeGreaterThan(0);
        expect(screen.getByText("potato")).toBeInTheDocument();
        expect(screen.getByText("mustard")).toBeInTheDocument();
      });

      // Verify suitability scores
      expect(screen.getAllByText("92%").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("81%")).toBeInTheDocument();
      expect(screen.getByText("74%")).toBeInTheDocument();

      // Verify rank badge for top recommendation
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText(/Best Match/i)).toBeInTheDocument();
    });

    it("should toggle between Agronomic Rules and ML model engine", async () => {
      api.rankCrops.mockResolvedValue({
        location: "bogura",
        recommendations: [{ crop: "rice", rank: 1, score: 0.9 }],
      });

      render(<CropRecommendation selectedDistrict="bogura" embedded={true} />);

      const mlButton = screen.getByRole("button", { name: /ML/i });
      expect(mlButton).toBeInTheDocument();

      fireEvent.click(mlButton);

      await waitFor(() => {
        expect(api.rankCrops).toHaveBeenCalledWith(
          expect.objectContaining({ use_ml: true })
        );
      });
    });
  });

  describe("3. District & Location Selector in ClimateDashboard", () => {
    it("should render district selector with options and fetch telemetry on change", async () => {
      api.getClimateData.mockResolvedValue({
        summary: {
          avg_temperature: 28.5,
          max_temperature: 34.0,
          min_temperature: 22.0,
          total_precipitation: 45.0,
          avg_humidity: 82.0,
          avg_soil_moisture: 0.72,
          avg_solar_radiation: 15.5,
          avg_wind_speed: 2.1,
        },
        data: [{ date: "2026-09-14", temp_avg: 28.5, precipitation: 10.0 }],
      });
      api.getClimateRisk.mockResolvedValue({ risks: [] });
      api.rankCrops.mockResolvedValue({ recommendations: [] });
      api.getFarmerAdvisories.mockResolvedValue({ advisories: [] });
      api.getFarms.mockResolvedValue([]);

      render(
        <AuthProvider>
          <ClimateDashboard />
        </AuthProvider>
      );

      const districtSelect = screen.getByLabelText(/Target Location \/ District/i);
      expect(districtSelect).toBeInTheDocument();

      // Change district to Rangpur
      fireEvent.change(districtSelect, { target: { value: "rangpur" } });

      await waitFor(() => {
        expect(api.getClimateData).toHaveBeenCalledWith(
          expect.objectContaining({ district: "rangpur" })
        );
      });
    });

    it("should render error banner in dashboard when climate data fails to load", async () => {
      api.getClimateData.mockRejectedValue(new Error("NASA POWER server unavailable"));
      api.getClimateRisk.mockResolvedValue({ risks: [] });
      api.rankCrops.mockResolvedValue({ recommendations: [] });
      api.getFarmerAdvisories.mockResolvedValue({ advisories: [] });
      api.getFarms.mockResolvedValue([]);

      render(
        <AuthProvider>
          <ClimateDashboard />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/NASA POWER server unavailable/i)
        ).toBeInTheDocument();
      });
    });

    it("should render farm selector dropdown without sign in prompt", async () => {
      api.getClimateData.mockResolvedValue({ summary: {}, data: [] });
      api.getClimateRisk.mockResolvedValue({ risks: [] });
      api.rankCrops.mockResolvedValue({ recommendations: [] });
      api.getFarmerAdvisories.mockResolvedValue({ advisories: [] });
      api.getFarms.mockResolvedValue([
        { id: 1, farm_name: "Barind Maize Field", district: "rajshahi", area: 4.5, area_unit: "bigha" },
      ]);

      render(<ClimateDashboard />);

      expect(screen.getByText(/Farm Parcel Selector/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage Farms/i)).toBeInTheDocument();
      expect(screen.queryByText(/Sign In to load your farms/i)).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/Barind Maize Field/i)).toBeInTheDocument();
      });
    });
  });

  describe("4. Navbar Component (No Auth UI)", () => {
    it("should render navigation links and CTA without Sign In / Register buttons", () => {
      render(<Navbar onOpenModal={vi.fn()} bgMode="normal" onToggleBgMode={vi.fn()} />);

      expect(screen.getByText(/Agri/i)).toBeInTheDocument();
      expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
      expect(screen.queryByText(/^Sign In$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sign In \/ Register/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Register$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sign Out/i)).not.toBeInTheDocument();
    });
  });

  describe("5. MyFarmManager Component (No Auth Gate)", () => {
    it("should render farm portfolio dashboard directly without Sign In gate", async () => {
      api.getFarms.mockResolvedValue([
        {
          id: 1,
          farm_name: "Karatoya Rice Basin",
          district: "bogura",
          latitude: 24.8465,
          longitude: 89.3773,
          area: 3.0,
          area_unit: "bigha",
          soil_type: "Alluvial Loam",
          current_crop: "Rice",
        },
      ]);

      render(<MyFarmManager />);

      expect(screen.getByText(/My Farm/i)).toBeInTheDocument();
      expect(screen.getByText(/Add New Farm/i)).toBeInTheDocument();
      expect(screen.queryByText(/Sign In to Access Your Farms/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Protected Agronomic Dashboard/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sign Out/i)).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getAllByText(/Karatoya Rice Basin/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("6. Navbar Navigation Links & Anchors", () => {
    it("should render working links to all recommended primary application sections", () => {
      const { container } = render(
        <Navbar onOpenModal={vi.fn()} bgMode="normal" onToggleBgMode={vi.fn()} />
      );

      const navLinks = container.querySelectorAll("a[href^='#']");
      const hrefs = Array.from(navLinks).map((a) => a.getAttribute("href"));

      expect(hrefs).toContain("#home");
      expect(hrefs).toContain("#dashboard");
      expect(hrefs).toContain("#nasa-data");
      expect(hrefs).toContain("#crop-recommendation");
      expect(hrefs).toContain("#climate-risk");
      expect(hrefs).toContain("#farmer-advisory");
      expect(hrefs).toContain("#farm-map");
    });
  });

  describe("7. Hero CTAs & Quick Jump Behavior", () => {
    it("should render primary 'Explore Demo Farm' and 'Live Map' CTAs with direct anchors", () => {
      const { container } = render(<Hero onOpenModal={vi.fn()} />);

      const exploreDemo = screen.getByText(/Explore Demo Farm/i).closest("a");
      expect(exploreDemo).toBeInTheDocument();
      expect(exploreDemo).toHaveAttribute("href", "#dashboard");

      const liveMap = screen.getByText(/Live Map/i).closest("a");
      expect(liveMap).toBeInTheDocument();
      expect(liveMap).toHaveAttribute("href", "#farm-map");

      // Verify quick jump pills
      const cropAdv = screen.getByText(/Crop Advisory/i).closest("a");
      expect(cropAdv).toHaveAttribute("href", "#crop-recommendation");

      const climateRisk = screen.getByText(/Climate Risk/i).closest("a");
      expect(climateRisk).toHaveAttribute("href", "#climate-risk");

      const farmerAdv = screen.getByText(/Farmer Advisory/i).closest("a");
      expect(farmerAdv).toHaveAttribute("href", "#farmer-advisory");

      const histTrends = screen.getByText(/Historical Trends/i).closest("a");
      expect(histTrends).toHaveAttribute("href", "#historical-trends");

      const nasaData = screen.getByText(/NASA Data/i).closest("a");
      expect(nasaData).toHaveAttribute("href", "#nasa-data");
    });
  });

  describe("8. Section CTA Routing & Functional Action Links", () => {
    it("should render actionable links in Features cards to corresponding tools", () => {
      const { container } = render(<Features />);

      const featureLinks = Array.from(container.querySelectorAll("a[href^='#']")).map((a) =>
        a.getAttribute("href")
      );

      expect(featureLinks).toContain("#nasa-data");
      expect(featureLinks).toContain("#crop-recommendation");
      expect(featureLinks).toContain("#historical-trends");
      expect(featureLinks).toContain("#climate-risk");
      expect(featureLinks).toContain("#farm-map");
      expect(featureLinks).toContain("#farmer-advisory");
    });

    it("should render working Live Telemetry link to #dashboard in NasaData", () => {
      const mockModal = vi.fn();
      render(<NasaData onOpenModal={mockModal} />);

      const liveTelemetry = screen.getByText(/Live Telemetry/i).closest("a");
      expect(liveTelemetry).toHaveAttribute("href", "#dashboard");

      // Sensor specs button should open informational modal
      const specsBtn = screen.getByText(/Sensor Specs/i);
      fireEvent.click(specsBtn);
      expect(mockModal).toHaveBeenCalledWith("specs");
    });

    it("should render working Launch Crop Intelligence link to #crop-recommendation in HowItWorks", () => {
      render(<HowItWorks onOpenModal={vi.fn()} />);

      const launchLink = screen.getByText(/Launch Crop Intelligence/i).closest("a");
      expect(launchLink).toHaveAttribute("href", "#crop-recommendation");
    });

    it("should render working Explore Demo Farm link to #dashboard in About", () => {
      render(<About onOpenModal={vi.fn()} />);

      const demoLink = screen.getByText(/Explore Demo Farm/i).closest("a");
      expect(demoLink).toHaveAttribute("href", "#dashboard");
    });
  });
});

