import { useState, useRef } from 'react';
import { Play, RotateCcw, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

import Navbar from './components/Navbar';
import ImageUpload from './components/ImageUpload';
import ProcessingPipeline from './components/ProcessingPipeline';
import ResultsSection from './components/ResultsSection';
import { useImageProcessing } from './hooks/useImageProcessing';
import { isMockMode } from './services/api';

// ── Coordinate grid background ────────────────────────────────────────────
function CoordGrid() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 opacity-[0.35]"
      aria-hidden="true"
      style={{
        backgroundImage:
          'linear-gradient(rgba(22,119,210,0.06) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(22,119,210,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  );
}

// ── Upload progress bar ───────────────────────────────────────────────────
function UploadProgress({ progress }) {
  if (progress === 0 || progress === 100) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-isro-text">
      <span className="shrink-0">Uploading…</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-isro-blue rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="font-mono shrink-0">{progress}%</span>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [imageData,  setImageData]  = useState(null);  // { file, previewUrl, imageType }
  const resultsRef                  = useRef(null);

  const {
    uploadProgress,
    stageStatuses,
    overallStatus,
    errorMessage,
    results,
    isMock,
    processImage,
    cancel,
    reset,
  } = useImageProcessing();

  const isProcessing  = overallStatus === 'uploading' || overallStatus === 'processing';
  const isCompleted   = overallStatus === 'completed';
  const isFailed      = overallStatus === 'failed';
  const hasStarted    = overallStatus !== 'idle';

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleImageReady = (data) => setImageData(data);

  const handleClear = () => {
    setImageData(null);
    reset();
  };

  const handleProcess = async () => {
    if (!imageData?.file || isProcessing) return;
    await processImage({ file: imageData.file, imageType: imageData.imageType });
    // Scroll to results after a tick
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  const handleReset = () => {
    cancel();
    setImageData(null);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-navy-950 relative">
      <CoordGrid />

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Page content ─────────────────────────────────────────── */}
      <main className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Mock mode banner ──────────────────────────────────── */}
        {isMock && (
          <div className="flex items-start gap-2.5 bg-navy-800/80 border border-isro-saffron/20
                          rounded-sm px-4 py-3 text-sm text-isro-saffron/80">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              <strong className="font-medium">Demo mode active — </strong>
              backend not connected. Set{' '}
              <code className="font-mono text-xs bg-black/30 px-1 py-0.5 rounded">VITE_USE_MOCK=false</code>
              {' '}and{' '}
              <code className="font-mono text-xs bg-black/30 px-1 py-0.5 rounded">VITE_API_BASE_URL</code>
              {' '}to connect the SimCLR model.
            </span>
          </div>
        )}

        {/* ── Page title ────────────────────────────────────────── */}
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Satellite Image Analysis
          </h1>
          <p className="text-sm text-isro-text mt-0.5">
            Upload a satellite image, select the sensor type, and run the SimCLR-based segmentation pipeline.
          </p>
        </div>

        {/* ── Two-column layout: upload + pipeline ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Upload — wider col */}
          <div className="lg:col-span-3 space-y-4">
            <ImageUpload
              onImageReady={handleImageReady}
              onClear={handleClear}
              isProcessing={isProcessing}
            />

            {/* Upload progress */}
            {overallStatus === 'uploading' && (
              <UploadProgress progress={uploadProgress} />
            )}

            {/* Process / Reset controls */}
            <div className="flex items-center gap-3">
              {!isCompleted ? (
                <>
                  <button
                    onClick={handleProcess}
                    disabled={!imageData?.file || isProcessing}
                    className="btn-primary flex-1 justify-center py-3 text-sm"
                    aria-label="Process image"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Play size={15} />
                        Process Image
                      </>
                    )}
                  </button>

                  {isProcessing && (
                    <button
                      onClick={cancel}
                      className="btn-secondary px-4 py-3 text-sm"
                      aria-label="Cancel processing"
                    >
                      Cancel
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleReset}
                  className="btn-secondary w-full justify-center py-3 text-sm"
                >
                  <RotateCcw size={14} />
                  Analyse Another Image
                </button>
              )}
            </div>

            {/* Disabled state hint */}
            {!imageData?.file && !isProcessing && (
              <p className="text-[11px] text-isro-text/40 text-center">
                Upload a satellite image to enable processing
              </p>
            )}
          </div>

          {/* Pipeline — narrower col */}
          <div className="lg:col-span-2">
            {hasStarted ? (
              <ProcessingPipeline
                stageStatuses={stageStatuses}
                isVisible={true}
                overallStatus={
                  overallStatus === 'uploading' ? 'processing' : overallStatus
                }
                errorMessage={errorMessage}
              />
            ) : (
              /* Placeholder when idle */
              <div className="panel h-full min-h-[200px] flex flex-col items-center justify-center
                              text-center px-6 py-10 space-y-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 border border-white/[0.07]
                                flex items-center justify-center">
                  <Play size={16} className="text-white/20 ml-0.5" />
                </div>
                <p className="text-sm text-isro-text/50">
                  Processing pipeline will appear here after you click Process Image.
                </p>
                <div className="space-y-1.5 w-full max-w-[200px]">
                  {['Preprocessing', 'Feature Extraction', 'Clustering', 'Segmentation', 'Result Generation'].map((s) => (
                    <div key={s} className="flex items-center gap-2 opacity-20">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                      <span className="text-[11px] text-isro-text">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Results ───────────────────────────────────────────── */}
        {isCompleted && (
          <div ref={resultsRef} className="scroll-mt-20">
            {/* Visual separator with label */}
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-isro-sky/50">
                Analysis Output
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <ResultsSection
              originalImageUrl={imageData?.previewUrl}
              results={results}
              isVisible={true}
              isMock={isMock}
            />
          </div>
        )}

        {/* ── Failed state ──────────────────────────────────────── */}
        {isFailed && !isCompleted && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20
                          rounded-sm px-4 py-4 text-sm text-red-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Processing failed</p>
              <p className="text-red-300/70">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="mt-2 btn-secondary text-xs text-red-300 border-red-500/30"
              >
                <RotateCcw size={12} />
                Try again
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.05] mt-16">
        <div className="max-w-screen-xl mx-auto px-5 py-5 flex flex-col sm:flex-row
                        items-center justify-between gap-2 text-[11px] text-isro-text/40">
          <span>GeoVision AI — Satellite Image Analysis Platform</span>
          <span>SimCLR · K-Means Segmentation · Self-Supervised Learning</span>
        </div>
      </footer>
    </div>
  );
}
