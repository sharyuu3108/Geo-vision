/**
 * useImageProcessing
 * Manages the full upload → process → poll → result lifecycle.
 */

import { useState, useRef, useCallback } from 'react';
import {
  uploadImage,
  startProcessing,
  getProcessingStatus,
  getAllResults,
  isMockMode,
} from '../services/api';
import { STAGES } from '../components/ProcessingPipeline';

const STAGE_IDS = STAGES.map((s) => s.id);

// Simulated delays per stage for mock mode (ms)
const MOCK_STAGE_DELAYS = [700, 1200, 900, 1100, 600];

function initStatuses() {
  return Object.fromEntries(STAGE_IDS.map((id) => [id, 'pending']));
}

export function useImageProcessing() {
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [stageStatuses,   setStageStatuses]   = useState(initStatuses());
  const [overallStatus,   setOverallStatus]   = useState('idle');   // idle | uploading | processing | completed | failed
  const [errorMessage,    setErrorMessage]    = useState('');
  const [results,         setResults]         = useState(null);
  const [currentJobId,    setCurrentJobId]    = useState(null);

  const pollTimerRef = useRef(null);
  const abortedRef   = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────
  const setStage = useCallback((stageId, status) => {
    setStageStatuses((prev) => ({ ...prev, [stageId]: status }));
  }, []);

  const reset = useCallback(() => {
    clearTimeout(pollTimerRef.current);
    abortedRef.current = false;
    setUploadProgress(0);
    setStageStatuses(initStatuses());
    setOverallStatus('idle');
    setErrorMessage('');
    setResults(null);
    setCurrentJobId(null);
  }, []);

  // ── Mock processing simulation ───────────────────────────────────────
  const runMockPipeline = useCallback(async (jobId) => {
    setOverallStatus('processing');

    for (let i = 0; i < STAGE_IDS.length; i++) {
      if (abortedRef.current) return;

      setStage(STAGE_IDS[i], 'processing');
      await new Promise((r) => setTimeout(r, MOCK_STAGE_DELAYS[i]));

      if (abortedRef.current) return;
      setStage(STAGE_IDS[i], 'completed');
    }

    if (abortedRef.current) return;

    // Fetch (mock) results
    try {
      const allResults = await getAllResults(jobId);
      setResults(allResults);
      setOverallStatus('completed');
    } catch (err) {
      setOverallStatus('failed');
      setErrorMessage(err.message || 'Failed to fetch results.');
    }
  }, [setStage]);

  // ── Real backend polling ─────────────────────────────────────────────
  const pollStatus = useCallback(async (jobId) => {
    if (abortedRef.current) return;

    try {
      const { status, stage } = await getProcessingStatus(jobId);

      // Update stage UI based on backend response
      if (stage) {
        const stageIdx = STAGE_IDS.indexOf(stage);
        for (let i = 0; i < STAGE_IDS.length; i++) {
          if (i < stageIdx)       setStage(STAGE_IDS[i], 'completed');
          else if (i === stageIdx) setStage(STAGE_IDS[i], 'processing');
        }
      }

      if (status === 'completed') {
        // Mark all done
        STAGE_IDS.forEach((id) => setStage(id, 'completed'));
        const allResults = await getAllResults(jobId);
        setResults(allResults);
        setOverallStatus('completed');
      } else if (status === 'failed') {
        setOverallStatus('failed');
        setErrorMessage('Backend reported a processing failure.');
      } else {
        // Keep polling
        pollTimerRef.current = setTimeout(() => pollStatus(jobId), 2000);
      }
    } catch (err) {
      if (!abortedRef.current) {
        setOverallStatus('failed');
        setErrorMessage(err.message || 'Lost connection to backend.');
      }
    }
  }, [setStage]);

  // ── Main entry point ─────────────────────────────────────────────────
  const processImage = useCallback(async ({ file, imageType }) => {
    reset();
    abortedRef.current = false;

    try {
      // 1. Upload
      setOverallStatus('uploading');
      const { jobId } = await uploadImage(file, imageType, setUploadProgress);
      if (abortedRef.current) return;
      setCurrentJobId(jobId);

      // 2. Start processing
      await startProcessing(jobId);
      if (abortedRef.current) return;

      // 3. Run pipeline
      if (isMockMode) {
        await runMockPipeline(jobId);
      } else {
        setOverallStatus('processing');
        setStage(STAGE_IDS[0], 'processing');
        pollStatus(jobId);
      }
    } catch (err) {
      if (!abortedRef.current) {
        setOverallStatus('failed');
        setErrorMessage(err.message || 'An error occurred.');
      }
    }
  }, [reset, runMockPipeline, pollStatus, setStage]);

  const cancel = useCallback(() => {
    abortedRef.current = true;
    clearTimeout(pollTimerRef.current);
    reset();
  }, [reset]);

  return {
    uploadProgress,
    stageStatuses,
    overallStatus,
    errorMessage,
    results,
    currentJobId,
    isMock: isMockMode,
    processImage,
    cancel,
    reset,
  };
}
