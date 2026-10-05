import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClimateRisk from "../components/ClimateRisk";
import CropRecommendation from "../components/CropRecommendation";
import ClimateDashboard from "../components/ClimateDashboard";
import { AuthProvider } from "../context/AuthContext";
import { api } from "../services/api";

// Mock the API service
vi.mock("../services/api", () => ({
  api: {
    getClimateRisk: vi.fn(),
    rankCrops: vi.fn(),
    getClimateData: vi.fn(),
    getFarmerAdvisories: vi.fn(),
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
  });
});
