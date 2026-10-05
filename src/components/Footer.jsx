import { Satellite, Github, Twitter, Linkedin, ArrowUp } from "lucide-react";

const navGroups = [
  {
    label: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Climate Data", href: "#climate-dashboard" },
      { label: "Earth Sensors", href: "#nasa-data" },
      { label: "How It Works", href: "#how-it-works" },
    ],
  },
  {
    label: "Results",
    links: [
      { label: "Impact Stats", href: "#impact" },
      { label: "Case Studies", href: "#impact" },
      { label: "ROI Calculator", href: "#impact" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Contact Sales", href: "#about" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#040810] text-white border-t border-white/8 overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-green-500/4 rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Main footer grid */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="#home" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300">
                <Satellite className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
                Agri<span className="text-green-400">Shift</span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI</span>
              </span>
            </a>

            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-6">
              AI-powered crop recommendations calibrated by NASA Earth observation data — built for sustainable, high-yield agriculture.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Github, label: "GitHub", href: "#" },
                { icon: Twitter, label: "Twitter", href: "#" },
                { icon: Linkedin, label: "LinkedIn", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-green-500/15 border border-white/8 hover:border-green-500/30 flex items-center justify-center text-gray-400 hover:text-green-400 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav link groups */}
          {navGroups.map((group) => (
            <div key={group.label}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                {group.label}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-green-400 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} AgriShift AI · All rights reserved · Powered by NASA POWER Data
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              NASA POWER Agroclimate: Active
            </span>
            <a
              href="#home"
              className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 transition-colors duration-200 border border-white/10 hover:border-green-400/30 px-3 py-1.5 rounded-lg"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Back to top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
