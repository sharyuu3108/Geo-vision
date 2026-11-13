import { CheckCircle2, Circle, XCircle, Loader2, ChevronRight } from 'lucide-react';

export const STAGES = [
  {
    id:    'preprocessing',
    label: 'Image Preprocessing',
    desc:  'Normalize, resize and prepare input tensor',
  },
  {
    id:    'feature_extraction',
    label: 'SimCLR Feature Extraction',
    desc:  'Self-supervised encoder — contrastive representation learning',
  },
  {
    id:    'clustering',
    label: 'K-Means Clustering',
    desc:  'Group feature vectors into semantic regions',
  },
  {
    id:    'segmentation',
    label: 'Semantic Segmentation',
    desc:  'Assign geographic class labels to pixel clusters',
  },
  {
    id:    'result_generation',
    label: 'Result Generation',
    desc:  'Produce segmentation map and colorized output',
  },
];

// ── Status → style mapping ────────────────────────────────────────────────
const STYLE = {
  pending: {
    icon:        <Circle size={16} className="text-white/20" />,
    labelClass:  'text-isro-text/60',
    descClass:   'text-isro-text/35',
    barClass:    '',
    badge:       <span className="status-pending">Pending</span>,
  },
  processing: {
    icon:        <Loader2 size={16} className="text-isro-sky animate-spin" />,
    labelClass:  'text-white',
    descClass:   'text-isro-text/70',
    barClass:    'bg-isro-blue progress-shimmer',
    badge:       <span className="status-processing">Processing…</span>,
  },
  completed: {
    icon:        <CheckCircle2 size={16} className="text-emerald-400" />,
    labelClass:  'text-white/90',
    descClass:   'text-isro-text/55',
    barClass:    'bg-emerald-500',
    badge:       <span className="status-completed">Completed</span>,
  },
  failed: {
    icon:        <XCircle size={16} className="text-red-400" />,
    labelClass:  'text-red-300',
    descClass:   'text-red-400/60',
    barClass:    'bg-red-500',
    badge:       <span className="status-failed">Failed</span>,
  },
};

// ── Single stage row ──────────────────────────────────────────────────────
function StageRow({ stage, status, isLast }) {
  const s = STYLE[status] || STYLE.pending;

  return (
    <li className="flex gap-3 items-stretch">
      {/* Left column — icon + connector */}
      <div className="flex flex-col items-center gap-0 shrink-0 pt-0.5">
        <div className="mt-0.5">{s.icon}</div>
        {!isLast && (
          <div className={`w-px flex-1 mt-1 mb-1 min-h-[24px]
                           ${status === 'completed'
                             ? 'bg-emerald-500/40'
                             : status === 'processing'
                               ? 'bg-isro-blue/40'
                               : 'bg-white/[0.07]'}`}
          />
        )}
      </div>

      {/* Right column — text + bar */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-sm font-medium transition-colors ${s.labelClass}`}>
            {stage.label}
          </span>
          {s.badge}
        </div>
        <p className={`text-xs mt-0.5 transition-colors ${s.descClass}`}>
          {stage.desc}
        </p>

        {/* Progress bar */}
        {(status === 'processing' || status === 'completed') && (
          <div className="mt-2.5 h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ${s.barClass}
                          ${status === 'completed' ? 'w-full' : 'w-2/3'}`}
            />
          </div>
        )}
      </div>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {Object}   props.stageStatuses   — { stageId: 'pending'|'processing'|'completed'|'failed' }
 * @param {boolean}  props.isVisible       — render only after user clicks Process
 * @param {string}   props.overallStatus   — 'idle'|'processing'|'completed'|'failed'
 * @param {string}   [props.errorMessage]
 */
export default function ProcessingPipeline({
  stageStatuses = {},
  isVisible = false,
  overallStatus = 'idle',
  errorMessage,
}) {
  if (!isVisible) return null;

  const completedCount = STAGES.filter(
    (s) => stageStatuses[s.id] === 'completed'
  ).length;

  return (
    <section className="panel" aria-label="Processing Pipeline">
      <div className="panel-header justify-between">
        <div className="flex items-center gap-3">
          <Loader2
            size={15}
            className={`text-isro-sky ${overallStatus === 'processing' ? 'animate-spin' : ''}`}
          />
          <span className="panel-header-label">Processing Pipeline</span>
        </div>
        <span className="text-[11px] text-isro-text">
          {completedCount}/{STAGES.length} stages
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs text-isro-text mb-1.5">
          <span>Overall Progress</span>
          <span className="font-mono">{Math.round((completedCount / STAGES.length) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700
                        ${overallStatus === 'failed'
                          ? 'bg-red-500'
                          : overallStatus === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-isro-blue'}`}
            style={{ width: `${(completedCount / STAGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stages list */}
      <ul className="px-5 py-5 space-y-0" aria-label="Processing stages">
        {STAGES.map((stage, i) => (
          <StageRow
            key={stage.id}
            stage={stage}
            status={stageStatuses[stage.id] || 'pending'}
            isLast={i === STAGES.length - 1}
          />
        ))}
      </ul>

      {/* Error banner */}
      {overallStatus === 'failed' && errorMessage && (
        <div className="mx-5 mb-5 px-3.5 py-3 bg-red-500/10 border border-red-500/25
                        rounded-sm text-sm text-red-300 flex items-start gap-2">
          <XCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </section>
  );
}
