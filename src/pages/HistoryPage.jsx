import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { History, Check, X, ArrowRight } from "lucide-react";
import { apiFetch } from "../lib/api";
import { templateLabel, templateAccent } from "../lib/templateMeta";

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const response = await apiFetch("/api/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      } else {
        setError("Failed to load history");
      }
    } catch (err) {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-iris border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="font-display font-normal text-3xl sm:text-[42px] text-ink tracking-tight">
          Generation History
        </h1>
        <p className="text-base text-ink/70 mt-1 font-normal">
          Track all your past AI generation requests and credit consumption
        </p>
      </div>

      {history.length > 0 ? (
        <div className="bg-paper border border-frost rounded-[24px] shadow-hard-sm overflow-hidden">
          <div className="divide-y divide-frost">
            {history.map((item) => {
              const label = templateLabel(item.templateType);
              const accent = templateAccent(item.templateType);
              const isSuccess = item.status === "success";

              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-chalk transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${accent}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-normal text-ink text-base">
                        {label}
                      </p>
                      <p className="text-xs font-mono text-ink/60 mt-0.5">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-full inline-flex items-center gap-1.5 ${
                        isSuccess
                          ? "bg-jelly-green text-white"
                          : "bg-marker-red text-white"
                      }`}
                    >
                      {isSuccess ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                      {isSuccess ? "Success" : "Failed"}
                    </span>

                    {item.creditsUsed > 0 && (
                      <span className="text-xs font-mono text-ink/60">
                        -{item.creditsUsed} credit
                        {item.creditsUsed !== 1 ? "s" : ""}
                      </span>
                    )}

                    {item.noteId && isSuccess && (
                      <Link
                        to={`/notes/${item.noteId}`}
                        className="px-4 py-2 bg-electric-iris text-white text-xs font-normal rounded-full shadow-hard-sm hover:translate-y-0.5 transition-all"
                      >
                        View Note
                      </Link>
                    )}

                    {!item.noteId && isSuccess && (
                      <span className="px-4 py-2 text-xs font-mono text-ink/40 italic">
                        Note deleted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-paper border border-frost rounded-[24px] p-12 shadow-hard text-center">
          <History size={44} strokeWidth={1.5} className="mx-auto mb-4 text-ink/30" />
          <h2 className="font-display font-normal text-2xl text-ink mb-2 tracking-tight">
            No generation history yet
          </h2>
          <p className="text-base text-ink/70 mb-8 max-w-md mx-auto leading-relaxed font-normal">
            When you transform PDFs into notes, flashcards, or MCQs, your full
            request history and credit usage log will appear here.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-8 py-4 bg-electric-iris text-white font-normal rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all text-lg"
          >
            <span>Upload PDF</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
