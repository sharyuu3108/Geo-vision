import { Globe, Info, Satellite } from 'lucide-react';
import { useState } from 'react';

// ── Minimal SVG orbit icon (no external deps) ────────────────────────────
function OrbitIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {/* Earth circle */}
      <circle cx="16" cy="16" r="5.5" fill="#1677D2" />
      <circle cx="16" cy="16" r="5.5" fill="url(#earthGrad)" />

      {/* Orbit ellipse */}
      <ellipse
        cx="16" cy="16" rx="13" ry="6"
        stroke="#55B8FF" strokeWidth="1.2"
        fill="none" opacity="0.7"
      />
      {/* Tilted orbit */}
      <ellipse
        cx="16" cy="16" rx="13" ry="6"
        stroke="#55B8FF" strokeWidth="1.2"
        fill="none" opacity="0.4"
        transform="rotate(60 16 16)"
      />

      {/* Satellite dot */}
      <circle cx="29" cy="16" r="2" fill="#FF9933" />
      <circle cx="8.5"  cy="6"  r="1.5" fill="#55B8FF" opacity="0.8" />

      <defs>
        <radialGradient id="earthGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#55B8FF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1677D2" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ── About modal ─────────────────────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header justify-between">
          <div className="flex items-center gap-2">
            <OrbitIcon size={22} />
            <span className="font-semibold text-white text-sm">About GeoVision AI</span>
          </div>
          <button
            onClick={onClose}
            className="text-isro-text hover:text-white transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-isro-text leading-relaxed">
          <p>
            <span className="text-white font-semibold">GeoVision AI</span> is a satellite
            image analysis platform built as part of the final-year engineering project:
          </p>
          <p className="text-isro-sky italic border-l-2 border-isro-blue/50 pl-3">
            "A Self-Supervised Deep Learning Framework for Semantic Image Analysis
            and AR-Based Visualization"
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-isro-saffron mt-0.5">▸</span>
              <span>SimCLR-based self-supervised feature extraction</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-isro-saffron mt-0.5">▸</span>
              <span>K-Means clustering for semantic segmentation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-isro-saffron mt-0.5">▸</span>
              <span>Supports optical, SAR, multispectral and thermal imagery</span>
            </div>
          </div>
          <p className="text-xs text-white/30 pt-2 border-t border-white/[0.07]">
            Inspired by ISRO Earth Observation Research Platforms
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy-900 border-b border-white/[0.07]">
        {/* Top accent stripe — saffron */}
        <div className="h-[2px] bg-gradient-to-r from-isro-saffron/0 via-isro-saffron to-isro-saffron/0" />

        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

          {/* Left — Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <OrbitIcon size={30} />
            <div className="leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="text-white font-semibold text-base tracking-tight">
                  GeoVision AI
                </span>
                <span className="hidden sm:inline text-[10px] font-semibold tracking-[0.14em] uppercase
                                 text-isro-saffron border border-isro-saffron/30 px-1.5 py-0.5 rounded-sm">
                  Beta
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-isro-text tracking-wide">
                Satellite Image Analysis Platform
              </p>
            </div>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5
                            bg-navy-800 border border-white/[0.07] rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-[11px] text-isro-text">SimCLR Model Ready</span>
            </div>

            <button
              onClick={() => setShowAbout(true)}
              className="btn-secondary px-3 py-1.5 text-xs"
              aria-label="About"
            >
              <Info size={14} />
              <span className="hidden sm:inline">About</span>
            </button>
          </div>
        </div>
      </header>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}
