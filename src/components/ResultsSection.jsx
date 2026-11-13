import { useState } from 'react';
import {
  BarChart3, Download, Layers, Map, SplitSquareHorizontal,
  Info, ChevronRight, AlertCircle,
} from 'lucide-react';

// ── Legend item ──────────────────────────────────────────────────────────
function LegendItem({ color, label, percentage, area_km2 }) {
  const pct = typeof percentage === 'number' ? percentage : null;

  return (
    <div className="flex items-center gap-2.5 group">
      <span
        className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-white/10"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm text-isro-text group-hover:text-white transition-colors flex-1 min-w-0 truncate">
        {label}
      </span>
      {pct !== null && (
        <span className="text-xs font-mono text-white/50 shrink-0">{pct.toFixed(1)}%</span>
      )}
    </div>
  );
}

// ── Distribution bar ─────────────────────────────────────────────────────
function DistributionBar({ predictions }) {
  if (!predictions?.length) return null;

  return (
    <div className="space-y-2.5">
      <p className="label-tag">Class-wise Distribution</p>
      {predictions.map((p) => (
        <div key={p.label}>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs text-isro-text">{p.label}</span>
            <span className="text-[11px] font-mono text-white/50">
              {typeof p.percentage === 'number' ? `${p.percentage.toFixed(1)}%` : '—'}
              {typeof p.area_km2 === 'number' && (
                <span className="ml-1 text-white/30">{p.area_km2.toFixed(1)} km²</span>
              )}
            </span>
          </div>
          <div className="h-[5px] w-full bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:           `${p.percentage ?? 0}%`,
                backgroundColor: p.color ?? '#1677D2',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Image panel ──────────────────────────────────────────────────────────
function ImagePanel({ title, src, tag, alt }) {
  return (
    <div className="bg-black/25 border border-white/[0.07] rounded-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-white/[0.07] flex items-center justify-between">
        <span className="text-xs font-medium text-white/80">{title}</span>
        {tag && (
          <span className="text-[10px] tracking-widest uppercase font-semibold
                           text-isro-sky/60 bg-isro-blue/10 px-1.5 py-0.5 rounded-sm">
            {tag}
          </span>
        )}
      </div>
      <div className="relative">
        {src ? (
          <img src={src} alt={alt} className="w-full object-contain max-h-72" />
        ) : (
          <div className="flex items-center justify-center h-48 text-white/15 text-sm">
            No image available
          </div>
        )}
        {/* Corner markers */}
        <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-isro-blue/30 pointer-events-none" />
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-isro-blue/30 pointer-events-none" />
        <span className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-isro-blue/30 pointer-events-none" />
        <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-isro-blue/30 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Stats card ───────────────────────────────────────────────────────────
function StatCard({ label, value, unit, sub }) {
  return (
    <div className="bg-navy-900/60 border border-white/[0.07] rounded-sm px-4 py-3">
      <p className="text-[10px] tracking-[0.13em] uppercase font-semibold text-isro-text/70 mb-1">{label}</p>
      <p className="text-xl font-semibold text-white leading-none">
        {value ?? '—'}
        {unit && <span className="text-sm text-isro-text ml-1 font-normal">{unit}</span>}
      </p>
      {sub && <p className="text-[11px] text-isro-text/50 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
/**
 * @param {Object}  props
 * @param {string}  props.originalImageUrl
 * @param {Object}  props.results            — { segmentation, colorized, predictions }
 * @param {boolean} props.isVisible
 * @param {boolean} props.isMock
 */
export default function ResultsSection({ originalImageUrl, results, isVisible, isMock }) {
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'segmentation' | 'colorized'

  if (!isVisible) return null;

  const { segmentation, colorized, predictions } = results ?? {};

  const segSrc   = segmentation?.image_data || segmentation?.image_url;
  const colorSrc = colorized?.image_data    || colorized?.image_url;
  const preds    = predictions?.predictions ?? [];
  const conf     = predictions?.confidence;
  const procTime = predictions?.processing_time_s;
  const note     = predictions?.note;

  // ── Download handler ────────────────────────────────────────────────
  const handleDownload = (src, filename) => {
    if (!src) return;
    const a = document.createElement('a');
    a.href     = src;
    a.download = filename;
    a.click();
  };

  const TABS = [
    { id: 'comparison',   label: 'Side-by-side',      icon: <SplitSquareHorizontal size={13} /> },
    { id: 'segmentation', label: 'Segmentation Map',  icon: <Layers size={13} /> },
    { id: 'colorized',    label: 'Colorized Output',  icon: <Map size={13} /> },
  ];

  return (
    <section className="space-y-4" aria-label="Analysis Results">

      {/* ── Mock notice ─────────────────────────────────────────── */}
      {isMock && (
        <div className="flex items-start gap-2.5 bg-isro-saffron/8 border border-isro-saffron/25
                        rounded-sm px-4 py-3 text-sm text-isro-saffron/90">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold">Sample data mode — </strong>
            {note ?? 'Connect the SimCLR backend to see real model output.'}
          </span>
        </div>
      )}

      {/* ── Results header ──────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <BarChart3 size={15} className="text-isro-sky" />
          <span className="panel-header-label">Analysis Results</span>
        </div>

        {/* Summary stats */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Classes Detected"
            value={preds.length || '—'}
            sub="geographic categories"
          />
          <StatCard
            label="Confidence"
            value={conf != null ? `${(conf * 100).toFixed(1)}` : '—'}
            unit={conf != null ? '%' : undefined}
            sub="segmentation score"
          />
          <StatCard
            label="Processing Time"
            value={procTime != null ? procTime.toFixed(1) : '—'}
            unit={procTime != null ? 's' : undefined}
            sub="end-to-end pipeline"
          />
          <StatCard
            label="Total Regions"
            value={preds.reduce((s, p) => s + (p.area_km2 ? 1 : 0), 0) || '—'}
            sub="segmented areas"
          />
        </div>
      </div>

      {/* ── Image viewer ────────────────────────────────────────── */}
      <div className="panel">
        {/* Tab bar */}
        <div className="border-b border-white/[0.07] flex items-center gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium
                          transition-colors whitespace-nowrap border-b-2 -mb-px
                          ${activeTab === tab.id
                            ? 'border-isro-blue text-white'
                            : 'border-transparent text-isro-text hover:text-white hover:border-white/20'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          {/* Download button — right-aligned */}
          <div className="ml-auto px-3 flex items-center gap-2">
            <button
              onClick={() => handleDownload(colorSrc, 'geovision-colorized.png')}
              disabled={!colorSrc}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
              title="Download colorized output"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Download Result</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'comparison' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImagePanel
                title="Original Image"
                src={originalImageUrl}
                tag="Input"
                alt="Original uploaded satellite image"
              />
              <ImagePanel
                title="Colorized Segmentation"
                src={colorSrc}
                tag="Output"
                alt="Colorized geographic segmentation map"
              />
            </div>
          )}

          {activeTab === 'segmentation' && (
            <ImagePanel
              title="Semantic Segmentation Map"
              src={segSrc}
              tag="Segmentation"
              alt="Semantic segmentation output"
            />
          )}

          {activeTab === 'colorized' && (
            <ImagePanel
              title="Colorized Geographic Map"
              src={colorSrc}
              tag="Colorized"
              alt="Colorized geographic output map"
            />
          )}
        </div>
      </div>

      {/* ── Legend + distribution ─────────────────────────────── */}
      {preds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Legend */}
          <div className="panel">
            <div className="panel-header">
              <Layers size={14} className="text-isro-sky" />
              <span className="panel-header-label">Class Legend</span>
            </div>
            <div className="p-5 space-y-2.5">
              {preds.map((p) => (
                <LegendItem
                  key={p.label}
                  color={p.color}
                  label={p.label}
                  percentage={p.percentage}
                  area_km2={p.area_km2}
                />
              ))}
            </div>
          </div>

          {/* Distribution bars */}
          <div className="panel">
            <div className="panel-header">
              <BarChart3 size={14} className="text-isro-sky" />
              <span className="panel-header-label">Area Distribution</span>
            </div>
            <div className="p-5">
              <DistributionBar predictions={preds} />
            </div>
          </div>
        </div>
      )}

      {/* ── Download all ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleDownload(colorSrc, 'geovision-colorized.png')}
          disabled={!colorSrc}
          className="btn-primary disabled:opacity-30"
        >
          <Download size={15} />
          Download Colorized Map
        </button>
        <button
          onClick={() => handleDownload(segSrc, 'geovision-segmentation.png')}
          disabled={!segSrc}
          className="btn-secondary disabled:opacity-30"
        >
          <Download size={14} />
          Download Segmentation
        </button>
      </div>
    </section>
  );
}
