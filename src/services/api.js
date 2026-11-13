/**
 * GeoVision AI — API Service
 *
 * All communication with the SimCLR backend goes through this file.
 * Set VITE_API_BASE_URL in .env to point at your backend.
 * Set VITE_USE_MOCK=true to run with sample data when the backend is not connected.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK  = import.meta.env.VITE_USE_MOCK === 'true';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,
});

// ─── Response interceptor for consistent error shape ───────────────────────
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unknown error';
    return Promise.reject(new Error(message));
  }
);

// ─── Mock helpers ──────────────────────────────────────────────────────────

/**
 * Returns a placeholder coloured image as a data-URL.
 * Used only when VITE_USE_MOCK=true.
 */
function makeMockImageDataUrl(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Sky background
  ctx.fillStyle = '#1a3a5c';
  ctx.fillRect(0, 0, width, height);

  // Vegetation patches
  ctx.fillStyle = '#2d7a3a';
  ctx.fillRect(50, 100, 180, 140);
  ctx.fillRect(300, 200, 150, 120);

  // Built-up area
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(100, 280, 200, 160);

  // Open land
  ctx.fillStyle = '#c4a35a';
  ctx.fillRect(320, 350, 140, 100);

  // Water body
  ctx.fillStyle = '#1e6b8a';
  ctx.fillRect(30, 350, 100, 80);

  // Grid overlay
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 1;
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Overlay label
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font      = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('[MOCK — backend not connected]', width / 2, height - 20);

  return canvas.toDataURL('image/png');
}

const MOCK_RESULTS = {
  jobId: 'mock-job-001',
  status: 'completed',
  segmentation_image: null,  // filled lazily on first access
  colorized_image:    null,
  predictions: [
    { label: 'Vegetation',  color: '#2d7a3a', percentage: 32.4, area_km2: 8.3  },
    { label: 'Buildings',   color: '#8b7355', percentage: 28.7, area_km2: 7.4  },
    { label: 'Open Land',   color: '#c4a35a', percentage: 21.6, area_km2: 5.5  },
    { label: 'Water Body',  color: '#1e6b8a', percentage: 11.2, area_km2: 2.9  },
    { label: 'Roads',       color: '#6b6b6b', percentage:  6.1, area_km2: 1.6  },
  ],
  confidence: 0.874,
  processing_time_s: 4.2,
  note: 'Sample data — connect backend for real model output.',
};

function getMockImages() {
  if (!MOCK_RESULTS.segmentation_image) {
    MOCK_RESULTS.segmentation_image = makeMockImageDataUrl(512, 512);
    MOCK_RESULTS.colorized_image    = makeMockImageDataUrl(512, 512);
  }
  return {
    segmentation_image: MOCK_RESULTS.segmentation_image,
    colorized_image:    MOCK_RESULTS.colorized_image,
  };
}

// ─── Mock delay ────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── API functions ─────────────────────────────────────────────────────────

/**
 * Upload a satellite image file.
 * @param {File} file
 * @param {string} imageType  — one of: grayscale | sar | optical | multispectral | thermal
 * @param {function} onProgress  — optional upload progress callback (0–100)
 * @returns {Promise<{ jobId: string }>}
 */
export async function uploadImage(file, imageType, onProgress) {
  if (USE_MOCK) {
    for (let p = 0; p <= 100; p += 20) {
      await delay(80);
      onProgress?.(p);
    }
    return { jobId: MOCK_RESULTS.jobId };
  }

  const form = new FormData();
  form.append('file', file);
  form.append('image_type', imageType);

  const { data } = await client.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data; // expected: { job_id: string }
}

/**
 * Trigger image processing for an uploaded job.
 * @param {string} jobId
 * @returns {Promise<{ jobId: string, status: string }>}
 */
export async function startProcessing(jobId) {
  if (USE_MOCK) {
    await delay(300);
    return { jobId, status: 'processing' };
  }

  const { data } = await client.post(`/api/process/${jobId}`);
  return data;
}

/**
 * Poll the processing status of a job.
 * @param {string} jobId
 * @returns {Promise<{ status: 'pending'|'processing'|'completed'|'failed', stage: string, progress: number }>}
 */
export async function getProcessingStatus(jobId) {
  if (USE_MOCK) {
    // Mock status is managed externally via startMockProcessing helper below
    return { status: 'completed', stage: 'result_generation', progress: 100 };
  }

  const { data } = await client.get(`/api/status/${jobId}`);
  return data;
}

/**
 * Retrieve segmentation result image URL/blob for a completed job.
 * @param {string} jobId
 * @returns {Promise<{ image_url: string } | { image_data: string }>}
 */
export async function getSegmentationResult(jobId) {
  if (USE_MOCK) {
    await delay(200);
    return { image_data: getMockImages().segmentation_image };
  }

  const { data } = await client.get(`/api/results/${jobId}/segmentation`);
  return data;
}

/**
 * Retrieve colorized output image URL/blob for a completed job.
 * @param {string} jobId
 * @returns {Promise<{ image_url: string } | { image_data: string }>}
 */
export async function getColorizedResult(jobId) {
  if (USE_MOCK) {
    await delay(200);
    return { image_data: getMockImages().colorized_image };
  }

  const { data } = await client.get(`/api/results/${jobId}/colorized`);
  return data;
}

/**
 * Retrieve predicted class labels and statistics for a completed job.
 * @param {string} jobId
 * @returns {Promise<{ predictions: Array, confidence: number, processing_time_s: number }>}
 */
export async function getPredictions(jobId) {
  if (USE_MOCK) {
    await delay(150);
    const { predictions, confidence, processing_time_s, note } = MOCK_RESULTS;
    return { predictions, confidence, processing_time_s, note };
  }

  const { data } = await client.get(`/api/results/${jobId}/predictions`);
  return data;
}

/**
 * Convenience: fetch all results (segmentation, colorized, predictions) in parallel.
 * @param {string} jobId
 */
export async function getAllResults(jobId) {
  const [seg, color, preds] = await Promise.all([
    getSegmentationResult(jobId),
    getColorizedResult(jobId),
    getPredictions(jobId),
  ]);
  return { segmentation: seg, colorized: color, predictions: preds };
}

export const isMockMode = USE_MOCK;
export const apiBaseUrl  = BASE_URL;
