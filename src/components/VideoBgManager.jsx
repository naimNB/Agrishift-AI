/**
 * VideoBgManager
 * ──────────────
 * Renders a fixed full-screen video background that switches based on
 * which page section is currently most visible in the viewport.
 *
 * - Uses IntersectionObserver (not scroll events) → efficient, no jank.
 * - Two <video> elements are kept in the DOM at all times: "active" and
 *   "incoming". On a section change we crossfade from active → incoming,
 *   then swap roles. This prevents black frames.
 * - Videos loop indefinitely until the section changes.
 * - Pointer-events: none so nothing in the underlying UI is blocked.
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Import all .mp4 files from assets, sorted by filename ───────────────────
const videoModules = import.meta.glob("../assets/*.mp4", { eager: true, query: "?url", import: "default" });
const VIDEO_SRCS = Object.keys(videoModules)
  .sort()                         // 0.mp4, 1.mp4, 2.mp4 …
  .map((k) => videoModules[k]);

// ─── Section → video index mapping ──────────────────────────────────────────
// Order must match the visual top-to-bottom order of sections on the page.
const SECTION_MAP = [
  { id: "home",         videoIdx: 0 },
  { id: "features",     videoIdx: 1 },
  { id: "nasa-data",    videoIdx: 2 },
  { id: "how-it-works", videoIdx: 3 },
  { id: "impact",       videoIdx: 4 },
  { id: "about",        videoIdx: 4 }, // last video repeats for final section
];

const FADE_DURATION = 600; // ms

export default function VideoBgManager() {
  // Index of the currently displayed video
  const [activeIdx, setActiveIdx] = useState(0);
  // Which "slot" (A or B) is on top
  const [topSlot, setTopSlot] = useState("a"); // "a" | "b"

  const slotARef = useRef(null);
  const slotBRef = useRef(null);
  const fadeTimer = useRef(null);

  // Track the "most visible" section (highest intersection ratio)
  const sectionRatios = useRef({});
  const observerRef = useRef(null);

  // ── Play the video in the given slot ──────────────────────────────────────
  const playSlot = useCallback((slotRef, src) => {
    const el = slotRef.current;
    if (!el) return;
    el.src = src;
    el.load();
    el.play().catch(() => {/* autoplay blocked - muted so should be fine */});
  }, []);

  // ── Crossfade to a new video index ────────────────────────────────────────
  const crossfadeTo = useCallback(
    (newIdx) => {
      if (newIdx === activeIdx) return;
      clearTimeout(fadeTimer.current);

      const src = VIDEO_SRCS[newIdx];
      if (!src) return;

      // Load new video into the BACK slot (not currently on top)
      const backRef = topSlot === "a" ? slotBRef : slotARef;
      playSlot(backRef, src);

      // Flip topSlot → back slot rises to top (CSS transition handles fade)
      setTopSlot((prev) => (prev === "a" ? "b" : "a"));
      setActiveIdx(newIdx);
    },
    [activeIdx, topSlot, playSlot]
  );

  // ── IntersectionObserver: track which section is most visible ─────────────
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionRatios.current[entry.target.id] = entry.intersectionRatio;
        });

        // Find section with highest ratio
        let bestId = null;
        let bestRatio = 0;
        for (const { id } of SECTION_MAP) {
          const r = sectionRatios.current[id] ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            bestId = id;
          }
        }

        if (bestId) {
          const mapping = SECTION_MAP.find((m) => m.id === bestId);
          if (mapping) crossfadeTo(mapping.videoIdx);
        }
      },
      {
        // Use multiple thresholds for smoother detection
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: "0px",
      }
    );

    // Observe each section
    SECTION_MAP.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
      clearTimeout(fadeTimer.current);
    };
  }, [crossfadeTo]);

  // ── Bootstrap: play first video in slot A on mount ────────────────────────
  useEffect(() => {
    if (VIDEO_SRCS.length > 0) {
      playSlot(slotARef, VIDEO_SRCS[0]);
    }
  }, [playSlot]);

  // ── Shared video element styles ───────────────────────────────────────────
  const baseStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: `opacity ${FADE_DURATION}ms ease-in-out`,
    pointerEvents: "none",
  };

  const isAOnTop = topSlot === "a";

  return (
    /*
     * Fixed container sits behind everything (z-0).
     * Navbar is sticky z-40, content is z-10+, so video never blocks UI.
     */
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Dark overlay so content stays legible over any video */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(6,11,23,0.55) 0%, rgba(6,11,23,0.45) 60%, rgba(6,11,23,0.75) 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Slot A */}
      <video
        ref={slotARef}
        muted
        playsInline
        loop
        style={{
          ...baseStyle,
          opacity: isAOnTop ? 1 : 0,
          zIndex: isAOnTop ? 1 : 0,
        }}
      />

      {/* Slot B */}
      <video
        ref={slotBRef}
        muted
        playsInline
        loop
        style={{
          ...baseStyle,
          opacity: isAOnTop ? 0 : 1,
          zIndex: isAOnTop ? 0 : 1,
        }}
      />
    </div>
  );
}
