import { useRef, useState, useCallback } from 'react';
import {
  UploadCloud, X, Image as ImageIcon,
  FileImage, ChevronDown, AlertCircle,
} from 'lucide-react';

const ACCEPTED_TYPES = {
  'image/png':  '.png',
  'image/jpeg': '.jpg / .jpeg',
  'image/tiff': '.tiff',
  'image/webp': '.webp',
};

const ACCEPTED_EXTENSIONS = /\.(png|jpe?g|tiff?|webp)$/i;

const IMAGE_TYPES = [
  { value: 'optical',       label: 'Optical',       desc: 'Standard RGB satellite imagery' },
  { value: 'sar',           label: 'SAR',            desc: 'Synthetic Aperture Radar' },
  { value: 'multispectral', label: 'Multispectral',  desc: 'Multiple spectral bands' },
  { value: 'thermal',       label: 'Thermal',        desc: 'Infrared / thermal band' },
  { value: 'grayscale',     label: 'Grayscale',      desc: 'Single-band intensity' },
];

function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Image Type Selector ──────────────────────────────────────────────────
function ImageTypeSelector({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const selected = IMAGE_TYPES.find((t) => t.value === value) || IMAGE_TYPES[0];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-2
                   bg-navy-900 border border-white/[0.1] hover:border-isro-blue/50
                   px-3.5 py-2.5 rounded-sm text-sm transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-white font-medium">{selected.label}</span>
          <span className="text-isro-text text-xs hidden sm:inline">— {selected.desc}</span>
        </div>
        <ChevronDown
          size={15}
          className={`text-isro-text shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-30
                     bg-navy-900 border border-white/[0.1] rounded-sm shadow-xl
                     overflow-hidden"
        >
          {IMAGE_TYPES.map((t) => (
            <li
              key={t.value}
              role="option"
              aria-selected={t.value === value}
              onClick={() => { onChange(t.value); setOpen(false); }}
              className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer text-sm
                          transition-colors hover:bg-isro-blue/10
                          ${t.value === value
                            ? 'text-isro-sky bg-isro-blue/10'
                            : 'text-isro-text hover:text-white'}`}
            >
              <span className="font-medium">{t.label}</span>
              <span className="text-xs opacity-60">{t.desc}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function ImageUpload({ onImageReady, onClear, isProcessing }) {
  const fileInputRef = useRef(null);
  const [dragging,   setDragging]   = useState(false);
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [imageType,  setImageType]  = useState('optical');
  const [error,      setError]      = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────
  const validateFile = (f) => {
    if (!f) return 'No file selected.';
    if (!ACCEPTED_EXTENSIONS.test(f.name)) {
      return `Unsupported format. Please upload PNG, JPG, JPEG or TIFF.`;
    }
    if (f.size > 100 * 1024 * 1024) return 'File exceeds 100 MB limit.';
    return null;
  };

  const readFile = useCallback((f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      setPreview(url);
      setFile(f);

      // Get natural dimensions
      const img = new window.Image();
      img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = url;

      onImageReady?.({ file: f, previewUrl: url, imageType });
    };
    reader.readAsDataURL(f);
  }, [imageType, onImageReady]);

  // Notify parent when imageType changes after a file is already loaded
  const handleTypeChange = (type) => {
    setImageType(type);
    if (file) onImageReady?.({ file, previewUrl: preview, imageType: type });
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setDimensions(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear?.();
  };

  // ── Drag events ────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) readFile(f);
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <section className="panel" aria-label="Image Upload">
      {/* Header */}
      <div className="panel-header">
        <FileImage size={15} className="text-isro-sky" />
        <span className="panel-header-label">Satellite Image Input</span>
      </div>

      <div className="p-5 space-y-5">

        {/* Drop zone / Preview */}
        {!preview ? (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center
                        border-2 border-dashed rounded-sm transition-all duration-200 cursor-pointer
                        min-h-[220px] select-none
                        ${dragging
                          ? 'border-isro-blue bg-isro-blue/5'
                          : 'border-white/[0.1] hover:border-isro-blue/40 hover:bg-white/[0.02]'}`}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Click or drag to upload satellite image"
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <UploadCloud
              size={40}
              className={`mb-3 transition-colors ${dragging ? 'text-isro-blue' : 'text-white/20'}`}
            />
            <p className="text-white/80 font-medium text-sm">
              {dragging ? 'Drop image here' : 'Drag & drop satellite image'}
            </p>
            <p className="text-isro-text text-xs mt-1">or click to browse files</p>
            <p className="text-white/25 text-[11px] mt-3">PNG · JPG · JPEG · TIFF · up to 100 MB</p>

            {/* Corner markers */}
            <span className="absolute top-2 left-2 w-3 h-3 border-t border-l border-isro-blue/30" />
            <span className="absolute top-2 right-2 w-3 h-3 border-t border-r border-isro-blue/30" />
            <span className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-isro-blue/30" />
            <span className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-isro-blue/30" />
          </div>
        ) : (
          /* Preview */
          <div className="relative bg-black/30 rounded-sm overflow-hidden border border-white/[0.07]">
            <img
              src={preview}
              alt="Uploaded satellite image preview"
              className="w-full object-contain max-h-72"
            />

            {/* Overlay top-bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between
                            bg-gradient-to-b from-black/70 to-transparent px-3 py-2">
              <div className="flex items-center gap-1.5">
                <ImageIcon size={12} className="text-isro-sky" />
                <span className="text-xs text-white/80 font-medium truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
              {!isProcessing && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                  className="flex items-center justify-center w-6 h-6 rounded-sm
                             bg-black/50 hover:bg-red-500/70 text-white/70 hover:text-white
                             transition-colors"
                  aria-label="Remove image"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Meta bar */}
            <div className="absolute bottom-0 left-0 right-0
                            bg-gradient-to-t from-black/80 to-transparent px-3 py-2
                            flex items-center gap-4 text-[11px] text-white/60">
              {dimensions && (
                <span>{dimensions.w} × {dimensions.h} px</span>
              )}
              <span>{formatBytes(file.size)}</span>
              <span className="ml-auto text-isro-sky/70 uppercase tracking-wider font-mono">
                {file.name.split('.').pop()?.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20
                          rounded-sm px-3 py-2.5 text-sm text-red-400">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Image type selector */}
        <div className="space-y-2">
          <label className="label-tag block">Image Type</label>
          <ImageTypeSelector
            value={imageType}
            onChange={handleTypeChange}
            disabled={isProcessing}
          />
        </div>

        {/* Replace button (shown when file loaded) */}
        {preview && !isProcessing && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary w-full justify-center text-xs"
          >
            <UploadCloud size={13} />
            Replace Image
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.tiff,.tif,.webp"
          className="sr-only"
          onChange={onFileChange}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
