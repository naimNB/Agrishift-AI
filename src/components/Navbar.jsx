import { useState, useEffect } from "react";
import { Menu, X, Satellite, Clapperboard, ImageIcon, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Farm Map", href: "#farm-map" },
  { label: "My Farm", href: "#my-farm" },
  { label: "Crop Ranking", href: "#crop-ranking" },
  { label: "Climate Risk", href: "#climate-risk" },
  { label: "Advisory", href: "#farmer-advisory" },
  { label: "Features", href: "#features" },
  { label: "Earth Sensors", href: "#nasa-data" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
  { label: "About", href: "#about" },
];

export default function Navbar({ onOpenModal, bgMode = "normal", onToggleBgMode }) {
  const { user, logout, openAuthModal, isAuthenticated } = useAuth();
  const isVideo = bgMode === "video";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 w-full z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[#060b17]/95 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 lg:px-10 py-4">
        {/* Brand */}
        <a
          href="#home"
          className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-green-400"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300">
            <Satellite className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
            Agri<span className="text-green-400">Shift</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-1 text-sm">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative px-3.5 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/8 transition-all duration-200 group"
            >
              {link.label}
              <span className="absolute inset-x-3 bottom-1 h-px bg-gradient-to-r from-green-400 to-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
            </a>
          ))}
        </div>

        {/* Desktop CTA & Auth */}
        <div className="hidden lg:flex items-center gap-3">
          {/* ── Video / Normal mode toggle ── */}
          <button
            type="button"
            id="bg-mode-toggle"
            onClick={onToggleBgMode}
            title={isVideo ? "Switch to Normal Mode" : "Switch to Video Mode"}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer ${
              isVideo
                ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25"
                : "bg-white/6 border-white/15 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/25"
            }`}
          >
            {/* Toggle track */}
            <span
              className="relative inline-flex w-7 h-3.5 rounded-full transition-colors duration-300 shrink-0"
              style={{ background: isVideo ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.12)" }}
            >
              <span
                className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-300 shadow"
                style={{
                  left: isVideo ? "calc(100% - 0.75rem)" : "0.125rem",
                  background: isVideo ? "#34d399" : "#6b7280",
                }}
              />
            </span>
            {isVideo ? (
              <><Clapperboard className="w-3.5 h-3.5" /> Video BG</>
            ) : (
              <><ImageIcon className="w-3.5 h-3.5" /> Normal</>  
            )}
          </button>

          {/* Auth State Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <a
                href="#my-farm"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 transition"
                title="View My Farm"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-xs font-semibold text-gray-200">{user.name.split(" ")[0]}</span>
              </a>
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/8 hover:bg-white/14 border border-white/15 text-gray-200 hover:text-white transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              Sign In
            </button>
          )}

          <a
            href="#features"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold text-sm shadow-lg shadow-green-500/25 hover:shadow-green-400/40 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-green-400"
          >
            Get Started →
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/10 text-white transition-all duration-200"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-2 border-t border-white/8 bg-[#060b17]/98 backdrop-blur-xl flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 px-4 rounded-xl text-gray-200 hover:text-white hover:bg-white/8 transition-all duration-200 text-sm font-medium"
            >
              {link.label}
            </a>
          ))}

          <div className="section-divider my-2" />

          {/* Mobile Auth Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-white">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-red-400 hover:underline text-xs"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                openAuthModal("login");
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm text-center transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign In / Register
            </button>
          )}

          {/* Mobile mode toggle */}
          <button
            type="button"
            onClick={() => { onToggleBgMode(); setMobileMenuOpen(false); }}
            className={`py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 mt-2 ${
              isVideo
                ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-300"
                : "bg-white/6 border border-white/12 text-gray-300"
            }`}
          >
            {isVideo ? (
              <><Clapperboard className="w-4 h-4" /> Video BG Active — Switch to Normal</>
            ) : (
              <><ImageIcon className="w-4 h-4" /> Normal Mode — Switch to Video BG</>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}