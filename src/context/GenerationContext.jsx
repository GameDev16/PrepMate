import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiFetch, getAuthHeaders } from '../lib/api';
import { useAuth } from './AuthContext';

const GenerationContext = createContext(null);

export function GenerationProvider({ children }) {
  const { refreshUser } = useAuth();
  const [jobs, setJobs] = useState({});
  const [currentJobId, setCurrentJobId] = useState(null);
  const [generationVersion, setGenerationVersion] = useState(0);

  const startGeneration = useCallback(async ({
    pdfUploadId,
    templates,
    depth,
    persona,
    language,
    customPrompt,
    notebookIds,
    includeDiagrams,
    includeCharts,
  }) => {
    if (!templates || templates.length === 0) return null;

    const jobId = "job_" + Date.now();
    setCurrentJobId(jobId);

    const params = {
      pdfUploadId,
      templates,
      depth,
      persona,
      language,
      customPrompt,
      notebookIds,
      includeDiagrams,
      includeCharts,
    };

    setJobs((prev) => ({
      ...prev,
      [jobId]: {
        id: jobId,
        status: "running", // pending -> running -> done | error
        completedCount: 0,
        totalCount: templates.length,
        generatedNotes: [],
        error: null,
        // Kept so a job can be retried (e.g. from GeneratingStep, or after
        // the user navigates away and back) without depending on whatever
        // local component state happened to start it — that state may not
        // exist anymore if the page that started this job has unmounted.
        params,
      },
    }));

    const notes = [];

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];

      try {
        const response = await apiFetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            pdfUploadId,
            template,
            depth,
            persona,
            language,
            customPrompt: customPrompt || undefined,
            notebookIds: notebookIds || undefined,
            includeDiagrams: !!includeDiagrams,
            includeCharts: !!includeCharts,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          notes.push(data.note);
          setJobs((prev) => {
            const current = prev[jobId] || {};
            return {
              ...prev,
              [jobId]: {
                ...current,
                completedCount: i + 1,
                generatedNotes: [...(current.generatedNotes || []), data.note],
              },
            };
          });
        } else {
          // If any attempt fails, halt loop, set error status, refresh user credits, and stop
          const errorMsg = data.error || "AI generation failed after 3 attempts. Please try again in a moment.";
          setJobs((prev) => {
            const current = prev[jobId] || {};
            return {
              ...prev,
              [jobId]: {
                ...current,
                status: "error",
                error: errorMsg,
              },
            };
          });
          await refreshUser();
          return jobId;
        }
      } catch (err) {
        const errorMsg = err.message || "Network error during AI generation.";
        setJobs((prev) => {
          const current = prev[jobId] || {};
          return {
            ...prev,
            [jobId]: {
              ...current,
              status: "error",
              error: errorMsg,
            },
          };
        });
        await refreshUser();
        return jobId;
      }
    }

    // All templates generated successfully
    setJobs((prev) => {
      const current = prev[jobId] || {};
      return {
        ...prev,
        [jobId]: {
          ...current,
          status: "done",
          completedCount: templates.length,
        },
      };
    });

    setGenerationVersion((v) => v + 1);
    await refreshUser();
    return jobId;
  }, [refreshUser]);

  const dismissJob = useCallback((jobId) => {
    setJobs((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
    if (currentJobId === jobId) {
      setCurrentJobId(null);
    }
  }, [currentJobId]);

  // Re-runs a job using the params it was originally started with. This is
  // the only retry path that's safe to call from anywhere — it doesn't
  // touch any page's local component state, which may no longer exist if
  // the user navigated away from the page that started the job.
  const retryJob = useCallback((jobId) => {
    const job = jobs[jobId];
    if (!job || !job.params) return null;
    dismissJob(jobId);
    return startGeneration(job.params);
  }, [jobs, dismissJob, startGeneration]);

  const getJobProgress = useCallback((job) => {
    if (!job) return 0;
    if (job.status === "done") return 100;
    // Cap progress at 90% while requests are in flight (#3)
    const rawPct = Math.round((job.completedCount / job.totalCount) * 100);
    return Math.min(90, rawPct);
  }, []);

  const value = {
    jobs,
    currentJobId,
    currentJob: currentJobId ? jobs[currentJobId] : null,
    generationVersion,
    startGeneration,
    dismissJob,
    retryJob,
    getJobProgress,
  };

  return <GenerationContext.Provider value={value}>{children}</GenerationContext.Provider>;
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
}
