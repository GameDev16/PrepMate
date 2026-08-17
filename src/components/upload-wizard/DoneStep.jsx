import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

function DoneStep({ currentJob, onUploadAnother }) {
  const noteCount = currentJob?.generatedNotes?.length || 1;

  return (
    <div className="bg-paper border border-frost card-rounded p-12 shadow-hard text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-jelly-green rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={40} strokeWidth={3} className="text-white" />
      </div>
      <h2 className="font-display font-normal text-[28px] text-ink tracking-tight mb-4">
        Notes Generated!
      </h2>
      <p className="text-ink/60 mb-8">
        Successfully created {noteCount} note{noteCount !== 1 ? "s" : ""} from
        your PDF.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {currentJob?.generatedNotes?.length === 1 ? (
          <Link
            to={`/notes/${currentJob.generatedNotes[0].id}`}
            className="px-8 py-3 bg-electric-iris text-white font-bold btn-pill shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
          >
            View Note
          </Link>
        ) : (
          <Link
            to="/library"
            className="px-8 py-3 bg-electric-iris text-white font-bold btn-pill shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
          >
            View in Library
          </Link>
        )}
        <button
          onClick={onUploadAnother}
          className="px-8 py-3 bg-paper border-2 border-ink font-bold btn-pill shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          Upload Another
        </button>
      </div>
    </div>
  );
}

export default DoneStep;
