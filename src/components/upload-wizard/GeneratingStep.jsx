import React from "react";
import { Link } from "react-router-dom";
import { TriangleAlert, RotateCcw, LayoutDashboard, Library } from "lucide-react";
import { STATUS_MESSAGES } from "../../lib/uploadOptions";

function GeneratingStep({
  isJobError,
  currentJob,
  statusMessageIndex,
  templateCount,
  currentProgress,
  onBackToOptions,
  onStartOver,
  onRetry,
}) {
  return (
    <div className="bg-paper border border-frost card-rounded p-12 shadow-hard text-center animate-fade-in-up">
      {isJobError ? (
        <div className="space-y-6">
          <div className="w-20 h-20 bg-marker-red/10 border-2 border-marker-red rounded-full flex items-center justify-center mx-auto text-marker-red">
            <TriangleAlert size={36} strokeWidth={2} />
          </div>
          <h2 className="font-display font-bold text-2xl text-marker-red">
            Generation Failed — No Credits Were Used
          </h2>
          <p className="text-ink/80 max-w-md mx-auto font-medium bg-frost p-4 rounded-xl border border-ink/20">
            {currentJob.error ||
              "AI generation failed after 3 attempts. Please try again in a moment."}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {onBackToOptions ? (
              <button
                onClick={onBackToOptions}
                className="px-6 py-3 bg-paper border-2 border-ink font-bold rounded-xl shadow-hard-sm hover:bg-frost transition-all"
              >
                ← Back to Options
              </button>
            ) : (
              <button
                onClick={onStartOver}
                className="px-6 py-3 bg-paper border-2 border-ink font-bold rounded-xl shadow-hard-sm hover:bg-frost transition-all"
              >
                ← Start New Upload
              </button>
            )}
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-electric-iris text-white font-bold rounded-xl shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all inline-flex items-center gap-2"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              Retry Generation
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-electric-iris border-t-transparent mx-auto mb-8"></div>
          <h2 className="font-display font-normal text-[28px] text-ink tracking-tight mb-4">
            {STATUS_MESSAGES[statusMessageIndex]}
          </h2>
          <p className="text-ink/60 mb-8">
            Generating {templateCount} template
            {templateCount !== 1 ? "s" : ""}...
          </p>
          <div className="h-3 bg-frost rounded-full overflow-hidden max-w-md mx-auto border border-ink/20">
            <div
              className="h-full bg-electric-iris transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <p className="text-sm text-ink/60 mt-4 font-bold">
            {currentProgress}% complete
          </p>

          {/* This keeps running in the background via GenerationContext
              regardless of which page is mounted, and GenerationToast
              (rendered globally in AppShell) will notify you here. So it's
              genuinely safe to navigate away instead of waiting. */}
          <div className="mt-10 pt-8 border-t border-frost">
            <p className="text-sm text-ink/60 mb-4">
              This can take a minute — feel free to browse elsewhere. We'll
              show a notification when it's ready, and coming back to this
              page will pick up right where it left off.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard"
                className="px-5 py-2 bg-paper border-2 border-ink font-bold text-sm rounded-xl shadow-hard-sm hover:bg-frost transition-all inline-flex items-center gap-2"
              >
                <LayoutDashboard size={15} />
                Go to Dashboard
              </Link>
              <Link
                to="/library"
                className="px-5 py-2 bg-paper border-2 border-ink font-bold text-sm rounded-xl shadow-hard-sm hover:bg-frost transition-all inline-flex items-center gap-2"
              >
                <Library size={15} />
                Go to Library
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GeneratingStep;
