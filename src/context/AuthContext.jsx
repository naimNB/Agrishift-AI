/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SECURITY ARCHITECTURE & TRADEOFF DOCUMENTATION:
 * ───────────────────────────────────────────────────────────────────────────
 * Token Storage Strategy: localStorage (Bearer JWT)
 *
 * TRADEOFF ANALYSIS:
 * 1. Simplicity & Cross-Domain Portability:
 *    Storing JWT in localStorage eliminates CSRF (Cross-Site Request Forgery)
 *    risks because browser requests do not automatically attach the token.
 *    It also enables cross-domain API gateway communication without complex
 *    CORS withCredentials cookie configurations.
 *
 * 2. Security Tradeoff (XSS Vulnerability):
 *    Any script executing on the origin (XSS vulnerability) could potentially
 *    read localStorage. In high-security banking or production deployments,
 *    an HttpOnly + SameSite=Strict + Secure cookie with a short-lived access
 *    token (e.g. 15 minutes) and a rotating refresh token is the industry standard.
 *
 * 3. Mitigation Strategies Implemented:
 *    - Strict React JSX escaping prevents script injection.
 *    - Automated token decoding & expiration verification on application boot.
 *    - Proactive clearance of invalid/expired tokens on 401 Unauthorized responses.
 *    - Sensitive financial or personal credentials are never requested or stored.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getStoredToken, setStoredToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // "login" | "register"

  // Check if JWT token has expired based on payload
  const isTokenExpired = (jwtToken) => {
    if (!jwtToken) return true;
    try {
      const parts = jwtToken.split(".");
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  };

  // Rehydrate and verify current user on boot
  const loadUser = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken || isTokenExpired(storedToken)) {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
      setToken(storedToken);
    } catch (err) {
      console.warn("Auth token invalid or expired:", err.message);
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Reactive listener for expired or invalid token events from API requests
  useEffect(() => {
    const handleUnauthorized = (e) => {
      console.warn("Session expired or unauthorized:", e.detail?.message);
      setToken(null);
      setUser(null);
      setError("Your session has expired. Please sign in again.");
    };
    window.addEventListener("agrishift:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("agrishift:unauthorized", handleUnauthorized);
  }, []);

  // Login handler
  const login = async ({ email, password }) => {
    setError(null);
    try {
      const res = await api.login({ email, password });
      const newToken = res.access_token;
      setToken(newToken);
      // Fetch authenticated user profile
      const me = await api.getMe();
      setUser(me);
      setIsAuthModalOpen(false);
      return me;
    } catch (err) {
      const msg = err.message || "Invalid email or password.";
      setError(msg);
      throw new Error(msg);
    }
  };

  // Register handler
  const register = async ({ name, email, password }) => {
    setError(null);
    try {
      await api.register({ name, email, password });
      // Automatically log in after successful registration
      return await login({ email, password });
    } catch (err) {
      const msg = err.message || "Registration failed. Please check your inputs.";
      setError(msg);
      throw new Error(msg);
    }
  };

  // Logout handler
  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Modal controls
  const openAuthModal = (mode = "login") => {
    setAuthModalMode(mode);
    setError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    openAuthModal,
    closeAuthModal,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      isAuthModalOpen: false,
      authModalMode: "login",
      setAuthModalMode: () => {},
      openAuthModal: () => {},
      closeAuthModal: () => {},
      refreshUser: async () => {},
    };
  }
  return context;
}

export default AuthContext;
