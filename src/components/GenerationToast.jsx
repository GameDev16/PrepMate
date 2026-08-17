import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';

const AUTO_DISMISS_MS = 5000;

function GenerationToast() {
  const { jobs, dismissJob } = useGeneration();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeToasts, setActiveToasts] = useState([]);
  // Tracks which job ids already have an auto-dismiss timer running, so a
  // toast doesn't get its countdown reset just because some unrelated job's
  // status changed and re-ran this effect.
  const timersRef = useRef({});

  useEffect(() => {
    // Check all jobs for done/error status that we haven't dismissed
    const jobList = Object.values(jobs);
    const finishedJobs = jobList.filter(
      (job) => job.status === 'done' || job.status === 'error'
    );

    setActiveToasts(finishedJobs);

    finishedJobs.forEach((job) => {
      if (timersRef.current[job.id]) return;
      timersRef.current[job.id] = setTimeout(() => {
        delete timersRef.current[job.id];
        dismissJob(job.id);
      }, AUTO_DISMISS_MS);
    });

    // Clean up timers for jobs that are no longer around (dismissed some
    // other way, e.g. clicked away) so we don't leak timers or fire a
    // dismiss call for a job that's already gone.
    Object.keys(timersRef.current).forEach((jobId) => {
      if (!finishedJobs.some((j) => j.id === jobId)) {
        clearTimeout(timersRef.current[jobId]);
        delete timersRef.current[jobId];
      }
    });
  }, [jobs, dismissJob]);

  useEffect(() => {
    // Clear all pending timers on unmount
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  function handleDismiss(jobId) {
    if (timersRef.current[jobId]) {
      clearTimeout(timersRef.current[jobId]);
      delete timersRef.current[jobId];
    }
    dismissJob(jobId);
  }

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full animate-fade-in-up">
      {activeToasts.map((job) => {
        const isSuccess = job.status === 'done';
        const count = job.generatedNotes ? job.generatedNotes.length : 0;

        return (
          <div
            key={job.id}
            className={`relative overflow-hidden p-4 rounded-2xl border-2 border-ink shadow-hard flex items-center justify-between gap-3 transition-all ${
              isSuccess ? 'bg-jelly-green text-white' : 'bg-marker-red text-white'
            }`}
          >
            {/* Countdown bar — shrinks over the same 5s window as the
                auto-dismiss timer above, so it visually tells you how long
                you have left before this toast disappears on its own. */}
            <div className="absolute top-0 left-0 h-1 bg-white/70 animate-toast-countdown" />

            <div
              className="flex-1 cursor-pointer select-none"
              onClick={() => {
                if (isSuccess && location.pathname !== '/library') {
                  navigate('/library');
                }
                handleDismiss(job.id);
              }}
            >
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                <span className="shrink-0">
                  {isSuccess ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
                </span>
                <span>
                  {isSuccess
                    ? `${count} note${count !== 1 ? 's' : ''} ready — View in Library`
                    : 'Generation failed — no credits used'}
                </span>
              </div>
              {!isSuccess && job.error && (
                <p className="text-xs opacity-90 mt-1 line-clamp-2 font-medium">
                  {job.error}
                </p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(job.id);
              }}
              className="p-1 rounded-lg hover:bg-black/20 text-white"
              title="Dismiss"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default GenerationToast;
