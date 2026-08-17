import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Upload, ArrowRight, Star, Trash2, FileText, NotebookText, Library } from "lucide-react";
import { apiFetch, apiJson } from "../lib/api";
import { useGeneration } from "../context/GenerationContext";
import AddToNotebooksModal from "../components/AddToNotebooksModal";
import { TEMPLATE_LABELS, templateLabel, templateAccent } from "../lib/templateMeta";

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

function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { generationVersion } = useGeneration();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [modalNote, setModalNote] = useState(null);

  const searchTerm = searchParams.get("search") || "";
  const templateFilter = searchParams.get("templateType") || "";
  const bookmarkedFilter = searchParams.get("bookmarked") === "true";
  const notebookIdFilter = searchParams.get("notebookId") || "";

  // The input shows this local value immediately on every keystroke. It's
  // synced into the URL (which is what actually triggers a search) after a
  // short debounce, instead of on every single character.
  const [searchInput, setSearchInput] = useState(searchTerm);

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== searchTerm) {
        updateSearch(searchInput);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    fetchNotes();
  }, [
    generationVersion,
    searchTerm,
    templateFilter,
    bookmarkedFilter,
    notebookIdFilter,
  ]);

  async function fetchNotes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (templateFilter) params.set("templateType", templateFilter);
      if (bookmarkedFilter) params.set("bookmarked", "true");
      if (notebookIdFilter) params.set("notebookId", notebookIdFilter);

      const response = await apiFetch(`/api/notes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      } else {
        setError("Failed to load notes");
      }
    } catch (err) {
      setError("Failed to load notes");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }

  async function toggleBookmark(noteId, currentState) {
    try {
      const response = await apiFetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBookmarked: !currentState }),
      });

      if (response.ok) {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === noteId
              ? { ...note, isBookmarked: !currentState }
              : note,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  }

  async function deleteNote(noteId) {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await apiFetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

  function updateSearch(value) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  }

  function updateTemplateFilter(value) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("templateType", value);
    } else {
      params.delete("templateType");
    }
    setSearchParams(params);
  }

  function toggleBookmarkedFilter() {
    const params = new URLSearchParams(searchParams);
    if (bookmarkedFilter) {
      params.delete("bookmarked");
    } else {
      params.set("bookmarked", "true");
    }
    setSearchParams(params);
  }

  if (initialLoad && loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-iris border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-3xl sm:text-[42px] text-ink tracking-tight">
            Library
          </h1>
          <p className="text-base text-ink/70 mt-1 font-normal">
            Your saved collection of AI-generated summaries, cards, and quizzes
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-electric-iris text-white font-normal rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <Upload size={18} strokeWidth={2.5} />
          <span>Upload PDF</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-paper border border-frost rounded-[24px] p-4 shadow-hard-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Search notes across titles and content..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-5 py-2.5 bg-chalk border border-frost rounded-full focus:outline-none focus:ring-2 focus:ring-electric-iris text-ink font-normal text-sm"
          />
        </div>
        <select
          value={templateFilter}
          onChange={(e) => updateTemplateFilter(e.target.value)}
          className="px-5 py-2.5 bg-chalk border border-frost rounded-full focus:outline-none focus:ring-2 focus:ring-electric-iris text-ink font-normal text-sm"
        >
          <option value="">All Templates</option>
          {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={toggleBookmarkedFilter}
          className={`px-5 py-2.5 rounded-full border font-normal text-sm transition-all flex items-center gap-2 shrink-0 ${
            bookmarkedFilter
              ? "border-electric-iris bg-electric-iris text-white shadow-hard-sm"
              : "border-frost bg-chalk text-ink hover:border-ink/30"
          }`}
        >
          <Star size={16} fill={bookmarkedFilter ? "currentColor" : "none"} />
          <span>Bookmarked</span>
        </button>
      </div>

      {/* Notes grid */}
      <div
        className={
          loading ? "opacity-50 transition-opacity" : "transition-opacity"
        }
      >
        {notes.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => {
              const label = templateLabel(note.templateType);
              const accent = templateAccent(note.templateType);

              return (
                <div
                  key={note.id}
                  className="bg-paper border border-frost rounded-[24px] p-6 shadow-hard-sm hover:-translate-y-1 hover:shadow-hard transition-all group relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <span className={`w-3 h-3 rounded-full shrink-0 mt-2 ${accent}`} />
                      <div className="relative z-20 flex items-center gap-2">
                        <button
                          onClick={() => setModalNote(note)}
                          title="Add to Notebooks"
                          className="px-3 py-1 bg-chalk text-ink text-xs font-normal rounded-full border border-frost hover:border-electric-iris transition-all inline-flex items-center gap-1.5"
                        >
                          <NotebookText size={13} />
                          Notebooks
                        </button>
                        <button
                          onClick={() =>
                            toggleBookmark(note.id, note.isBookmarked)
                          }
                          className={`transition-colors ${
                            note.isBookmarked
                              ? "text-hi-yellow"
                              : "text-ink/30 hover:text-hi-yellow"
                          }`}
                        >
                          <Star size={18} fill={note.isBookmarked ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-ink/30 hover:text-marker-red transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-display font-normal text-2xl text-ink line-clamp-2 mb-3 group-hover:text-electric-iris transition-colors tracking-tight">
                      {note.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-frost text-xs font-mono uppercase tracking-wider rounded-full text-ink">
                        {label}
                      </span>
                      {note.outputLanguage &&
                        note.outputLanguage !== "English" &&
                        note.outputLanguage !== "Same as PDF" && (
                          <span className="px-3 py-1 bg-hi-yellow/40 text-xs font-mono uppercase tracking-wider rounded-full text-ink">
                            {note.outputLanguage}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-ink/60 mt-4 pt-3 border-t border-frost">
                    <span className="truncate max-w-[60%] inline-flex items-center gap-1.5">
                      <FileText size={13} className="shrink-0" />
                      {note.pdfFileName || "Unknown source"}
                    </span>
                    <span>{formatRelativeTime(note.createdAt)}</span>
                  </div>

                  {/* Full-card click target. Positioned absolute + z-10, sits
                      above the plain (non-positioned) content above so a
                      click anywhere on the card opens the note, but *below*
                      the action buttons (z-20) so those still work without
                      also triggering navigation. Also gets you real <a>
                      behavior for free — middle-click/ctrl-click to open in
                      a new tab, keyboard focus, etc. — which a div onClick
                      handler would not. */}
                  <Link
                    to={`/notes/${note.id}`}
                    className="absolute inset-0 z-10 rounded-[24px]"
                    aria-label={`Open note: ${note.title}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-paper border border-frost rounded-[24px] p-12 shadow-hard text-center">
            <Library size={44} strokeWidth={1.5} className="mx-auto mb-4 text-ink/30" />
            <h2 className="font-display font-normal text-2xl text-ink mb-2 tracking-tight">
              No notes in your library yet
            </h2>
            <p className="text-base text-ink/70 mb-8 max-w-md mx-auto leading-relaxed font-normal">
              Upload a PDF to start turning your study guides and chapters into
              creative, art room notes.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-electric-iris text-white font-normal rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all text-lg"
            >
              <span>Upload PDF</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </div>

      <AddToNotebooksModal
        note={modalNote}
        isOpen={!!modalNote}
        onClose={() => setModalNote(null)}
      />
    </div>
  );
}

export default LibraryPage;
