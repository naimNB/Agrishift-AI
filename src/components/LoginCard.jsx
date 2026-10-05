import { useState } from "react";
import {
  Tractor,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
  X,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginCard({
  initialMode = "login",
  onSuccess,
  onClose,
  showDemoButton = true,
  className = "",
}) {
  const { user, login, register, logout, isAuthenticated } = useAuth();

  const [mode, setMode] = useState(initialMode); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (mode === "register") {
        if (!name.trim()) {
          throw new Error("Please enter your full name.");
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        setSuccessMessage("Account created successfully! Welcome to AgriShift AI.");
      } else {
        await login({
          email: email.trim(),
          password,
        });
        setSuccessMessage("Signed in successfully!");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Authentication error:", err);
      let friendlyMessage = err.message || "Authentication failed.";
      if (friendlyMessage.includes("401") || friendlyMessage.includes("Incorrect email")) {
        friendlyMessage = "Incorrect email address or password. Please try again.";
      } else if (friendlyMessage.includes("already registered")) {
        friendlyMessage = "This email is already registered. Please sign in instead.";
      }
      setErrorMessage(friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Demo Login
  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      try {
        await login({
          email: "farmer_naim@agrishift.org",
          password: "StrongPassword123",
        });
      } catch {
        // If demo user is missing, register it first
        await register({
          name: "Farmer Naim",
          email: "farmer_naim@agrishift.org",
          password: "StrongPassword123",
        });
      }
      setSuccessMessage("Logged in as Demo Farmer (Naim)!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to sign in with demo credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  // If already authenticated: show session status
  if (isAuthenticated && user) {
    return (
      <div
        className={`w-full max-w-[420px] bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-3xl p-7 text-white shadow-2xl relative ${className}`}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/25">
            <Tractor className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Authenticated Session Active
          </div>
          <h3 className="text-xl font-bold text-white">Welcome back, {user.name}</h3>
          <p className="text-xs text-gray-400 mt-1 font-mono">{user.email}</p>
        </div>

        <div className="mt-6 space-y-2.5">
          <a
            href="#my-farm"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Tractor className="w-4 h-4" />
            Manage My Farm Parcels
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/8 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-300 font-semibold text-xs transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated: render Login / Register form
  return (
    <div
      className={`w-full max-w-[420px] bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-7 text-white shadow-2xl relative ${className}`}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
          <Tractor className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          Agri<span className="text-emerald-400">Shift</span> AI
        </h2>

        <p className="text-xs text-gray-400 mt-1">
          {mode === "login"
            ? "Sign in to access your farm parcels & NASA agroclimatology"
            : "Create an account to start tracking farm intelligence"}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-xl mt-5 border border-white/10 text-xs">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setErrorMessage(null);
          }}
          className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
            mode === "login"
              ? "bg-emerald-500 text-black font-bold shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setErrorMessage(null);
          }}
          className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
            mode === "register"
              ? "bg-emerald-500 text-black font-bold shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
        {mode === "register" && (
          <div>
            <label className="block text-gray-300 font-medium mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Md. Naim"
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
              />
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-300 font-medium mb-1">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. farmer@agrishift.org"
              className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
            />
            <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
            />
            <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {mode === "login" ? "Signing In..." : "Creating Account..."}
            </>
          ) : mode === "login" ? (
            "Sign In to AgriShift"
          ) : (
            "Complete Registration"
          )}
        </button>
      </form>

      {/* Quick 1-Click Demo Login */}
      {showDemoButton && (
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-gray-400 mb-2 font-mono">Evaluation / Instant Access:</p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            1-Click Demo Login (Farmer Naim)
          </button>
        </div>
      )}
    </div>
  );
}