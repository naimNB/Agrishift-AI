import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { api, getStoredToken, setStoredToken, TOKEN_STORAGE_KEY } from "../services/api";

describe("API Service (src/services/api.js)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Token Storage Helpers", () => {
    it("should store and retrieve JWT token in localStorage", () => {
      expect(getStoredToken()).toBeNull();
      setStoredToken("test-jwt-token-123");
      expect(getStoredToken()).toBe("test-jwt-token-123");
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("test-jwt-token-123");
    });

    it("should remove JWT token when null is passed", () => {
      setStoredToken("token-to-remove");
      expect(getStoredToken()).toBe("token-to-remove");
      setStoredToken(null);
      expect(getStoredToken()).toBeNull();
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });
  });

  describe("Authentication API", () => {
    it("should perform login and persist access token", async () => {
      const mockResponse = {
        access_token: "mock-jwt-bearer-token",
        token_type: "bearer",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await api.login({
        email: "farmer@agrishift.org",
        password: "StrongPassword123",
      });

      expect(res.access_token).toBe("mock-jwt-bearer-token");
      expect(getStoredToken()).toBe("mock-jwt-bearer-token");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "farmer@agrishift.org",
            password: "StrongPassword123",
          }),
        })
      );
    });

    it("should throw formatted error on login failure (401)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Incorrect email or password" }),
      });

      await expect(
        api.login({ email: "wrong@test.com", password: "bad" })
      ).rejects.toThrow("Incorrect email or password");
    });

    it("should send registration payload", async () => {
      const mockUser = {
        id: 1,
        name: "Farmer Naim",
        email: "naim@agrishift.org",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      });

      const res = await api.register({
        name: "Farmer Naim",
        email: "naim@agrishift.org",
        password: "Password123!",
      });

      expect(res).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/register"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Farmer Naim",
            email: "naim@agrishift.org",
            password: "Password123!",
          }),
        })
      );
    });

    it("should include Bearer token in getMe request", async () => {
      setStoredToken("valid-token-abc");

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: "Farmer Naim" }),
      });

      await api.getMe();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/me"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer valid-token-abc",
          }),
        })
      );
    });

    it("should clear token on logout", () => {
      setStoredToken("active-token");
      expect(getStoredToken()).toBe("active-token");
      api.logout();
      expect(getStoredToken()).toBeNull();
    });
  });

  describe("401 Expired Token Event Dispatch", () => {
    it("should dispatch agrishift:unauthorized and clear token on 401 response", async () => {
      setStoredToken("expired-token-xyz");

      const eventListener = vi.fn();
      window.addEventListener("agrishift:unauthorized", eventListener);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Could not validate credentials" }),
      });

      await expect(api.getMe()).rejects.toThrow("Could not validate credentials");

      expect(eventListener).toHaveBeenCalled();
      expect(getStoredToken()).toBeNull();

      window.removeEventListener("agrishift:unauthorized", eventListener);
    });
  });

  describe("Climate, Crop Ranking, and Risk Endpoints", () => {
    it("should request climate telemetry with correct query parameters", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ summary: { avg_temperature: 28.5 }, data: [] }),
      });

      await api.getClimateData({
        district: "bogura",
        start: "2026-09-01",
        end: "2026-09-14",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/nasa/climate?district=bogura&start=2026-09-01&end=2026-09-14"),
        expect.any(Object)
      );
    });

    it("should query coordinate-based climate telemetry", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ summary: {}, data: [] }),
      });

      await api.getClimateData({
        lat: 24.8465,
        lon: 89.3773,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/nasa\/climate\?.*latitude=24\.8465.*longitude=89\.3773/),
        expect.any(Object)
      );
    });

    it("should query crop ranking engine", async () => {
      const mockRanking = {
        location: "bogura",
        recommendations: [{ crop: "rice", score: 0.92, rank: 1 }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRanking,
      });

      const res = await api.rankCrops({
        location: "bogura",
        temp_avg: 28.5,
        precipitation: 12.0,
      });

      expect(res.recommendations[0].crop).toBe("rice");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/predictions/rank-crops"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should query climate risk evaluation", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ overall_risk_level: "low", risks: [] }),
      });

      const res = await api.getClimateRisk({ district: "rajshahi" });
      expect(res.overall_risk_level).toBe("low");
    });

    it("should query farmer advisories", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ advisories: [], top_recommended_crop: "rice" }),
      });

      const res = await api.getFarmerAdvisories({ district: "dinajpur" });
      expect(res.top_recommended_crop).toBe("rice");
    });
  });

  describe("Network Error Handling", () => {
    it("should catch fetch failure and throw friendly offline message", async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(api.getMe()).rejects.toThrow(
        /Unable to reach backend server/
      );
    });
  });

  describe("Farm Portfolio Local Storage CRUD", () => {
    it("should retrieve default farms when unauthenticated", async () => {
      const farms = await api.getFarms();
      expect(Array.isArray(farms)).toBe(true);
      expect(farms.length).toBeGreaterThan(0);
      expect(farms[0]).toHaveProperty("farm_name");
    });

    it("should create, update, and delete farm parcels without login", async () => {
      const newFarm = await api.createFarm({
        farm_name: "Test Paddy Parcel",
        district: "bogura",
        latitude: 24.8465,
        longitude: 89.3773,
        area: 2.0,
        area_unit: "bigha",
        current_crop: "Rice",
      });
      expect(newFarm.farm_name).toBe("Test Paddy Parcel");
      expect(newFarm.id).toBeDefined();

      const updated = await api.updateFarm(newFarm.id, {
        farm_name: "Updated Paddy Parcel",
      });
      expect(updated.farm_name).toBe("Updated Paddy Parcel");

      const delRes = await api.deleteFarm(newFarm.id);
      expect(delRes.detail).toBe("Farm deleted successfully");
    });
  });
});

