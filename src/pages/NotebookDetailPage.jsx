import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileQuestion, Plus, Upload, Star, X, Trash2,
  FileText, NotebookText,
} from "lucide-react";
import { apiFetch, apiJson } from "../lib/api";
import { useGeneration } from "../context/GenerationContext";
import AddToNotebooksModal from "../components/AddToNotebooksModal";
import AddNotesToNotebookModal from "../components/AddNotesToNotebookModal";
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

function NotebookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { generationVersion } = useGeneration();

  const [notebook, setNotebook] = useState(null);
  const [notebookLoading, setNotebookLoading] = useState(true);
  const [notebookError, setNotebookError] = useState(null);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [bookmarkedFilter, setBookmarkedFilter] = useState(false);

  const [modalNote, setModalNote] = useState(null);
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);

  const fetchNotebook = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/notebooks/${id}`);
      if (response.ok) {
        const data = await response.json();
        setNotebook(data.notebook);
      } else if (response.status === 404) {
        setNotebookError("Notebook not found");
      } else {
        setNotebookError("Failed to load notebook");
      }
    } catch (err) {
      setNotebookError("Failed to load notebook");
    } finally {
      setNotebookLoading(false);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("notebookId", id);
      if (searchTerm) params.set("search", searchTerm);
      if (templateFilter) params.set("templateType", templateFilter);
      if (bookmarkedFilter) params.set("bookmarked", "true");

      const response = await apiFetch(`/api/notes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setNotesLoading(false);
      setInitialLoad(false);
    }
  }, [id, searchTerm, templateFilter, bookmarkedFilter]);

  useEffect(() => {
    setNotebookLoading(true);
    setNotebookError(null);
    fetchNotebook();
  }, [fetchNotebook]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, generationVersion]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== searchTerm) setSearchTerm(searchInput);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

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
        setNotebook((prev) =>
          prev ? { ...prev, noteCount: Math.max(0, (prev.noteCount || 1) - 1) } : prev,
        );
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

  async function removeFromNotebook(noteId) {
    try {
      const currentRes = await apiFetch(`/api/notes/${noteId}/notebooks`);
      let existingIds = [];
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        existingIds = (currentData.notebooks || []).map((nb) => nb.id);
      }
      const remainingIds = existingIds.filter((nbId) => nbId !== id);
      const response = await apiJson(`/api/notes/${noteId}/notebooks`, {
        method: "PUT",
        body: JSON.stringify({ notebookIds: remainingIds }),
      });
      if (response.ok) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        setNotebook((prev) =>
          prev ? { ...prev, noteCount: Math.max(0, (prev.noteCount || 1) - 1) } : prev,
        );
      }
    } catch (err) {
      console.error("Failed to remove note from notebook:", err);
    }
  }

  function toggleBookmarkedFilter() {
    setBookmarkedFilter((prev) => !prev);
  }

  function handleNotesAdded() {
    fetchNotebook();
    fetchNotes();
  }

  if (notebookLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-iris border-t-transparent"></div>
      </div>
    );
  }

  if (notebookError || !notebook) {
    return (
      <div className="bg-paper border border-frost rounded-[24px] p-12 shadow-hard text-center">
        <FileQuestion size={44} strokeWidth={1.5} className="mx-auto mb-4 text-ink/30" />
        <h2 className="font-display font-normal text-2xl text-ink mb-2 tracking-tight">
          {notebookError || "Notebook not found"}
        </h2>
        <Link
          to="/notebooks"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-electric-iris text-white font-normal rounded-full shadow-hard-sm hover:translate-y-0.5 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Notebooks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Notebook header */}
      <div className="bg-paper border border-frost rounded-[24px] overflow-hidden shadow-hard">
        <div className="h-2.5 w-full" style={{ backgroundColor: notebook.color }} />
        <div className="p-6 sm:p-8">
          <button
            onClick={() => navigate("/notebooks")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-ink/70 hover:text-electric-iris transition-colors"
          >
            <ArrowLeft size={15} />
            All Notebooks
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <NotebookText size={40} strokeWidth={1.5} style={{ color: notebook.color }} className="shrink-0 mt-1" />
              <div>
                <h1 className="font-display font-normal text-3xl sm:text-[42px] text-ink tracking-tight">
                  {notebook.name}
                </h1>
                {notebook.description && (
                  <p className="text-base text-ink/70 mt-1 font-normal max-w-xl leading-relaxed">
                    {notebook.description}
                  </p>
                )}
                <p className="text-xs font-mono text-ink/60 mt-3">
                  {notebook.noteCount || 0} note
                  {(notebook.noteCount || 0) !== 1 ? "s" : ""} inside
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowAddNotesModal(true)}
                className="px-5 py-2.5 bg-electric-iris text-white font-normal rounded-full shadow-hard-sm hover:translate-y-0.5 transition-all text-sm inline-flex items-center gap-1.5"
              >
                <Plus size={15} />
                Add notes
              </button>
              <Link
                to="/upload"
                className="px-5 py-2.5 border border-frost rounded-full hover:border-electric-iris hover:text-electric-iris transition-colors text-sm inline-flex items-center gap-1.5"
              >
                <Upload size={15} />
                Upload PDF
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-paper border border-frost rounded-[24px] p-4 shadow-hard-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Search titles and content in this notebook..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-5 py-2.5 bg-chalk border border-frost rounded-full focus:outline-none focus:ring-2 focus:ring-electric-iris text-ink font-normal text-sm"
          />
        </div>
        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
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
          notesLoading && !initialLoad
            ? "opacity-50 transition-opacity"
            : "transition-opacity"
        }
      >
        {initialLoad && notesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-iris border-t-transparent"></div>
          </div>
        ) : notes.length > 0 ? (
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
                          title="Manage Notebooks"
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
                    <span className="truncate max-w-[45%] inline-flex items-center gap-1.5">
                      <FileText size={13} className="shrink-0" />
                      {note.pdfFileName || "Unknown source"}
                    </span>
                    <div className="relative z-20 flex items-center gap-3 shrink-0">
                      <span>{formatRelativeTime(note.createdAt)}</span>
                      <button
                        onClick={() => removeFromNotebook(note.id)}
                        title="Remove from this notebook"
                        className="text-ink/30 hover:text-marker-red transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={15} />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        title="Delete note entirely"
                        className="text-ink/30 hover:text-marker-red transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Full-card click target — see LibraryPage.jsx for why
                      this is a stretched absolute Link rather than an
                      onClick on the outer div. */}
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
            <NotebookText size={44} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: notebook.color }} />
            <h2 className="font-display font-normal text-2xl text-ink mb-2 tracking-tight">
              {searchTerm || templateFilter || bookmarkedFilter
                ? "No notes match your filters"
                : "No notes in this notebook yet"}
            </h2>
            <p className="text-base text-ink/70 mb-8 max-w-md mx-auto leading-relaxed font-normal">
              {searchTerm || templateFilter || bookmarkedFilter
                ? "Try adjusting your search or filters."
                : "Add notes you've already generated, or upload a PDF to create new ones straight into this notebook."}
            </p>
            <button
              onClick={() => setShowAddNotesModal(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-electric-iris text-white font-normal rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all text-lg"
            >
              <span>Add Notes</span>
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>

      <AddToNotebooksModal
        note={modalNote}
        isOpen={!!modalNote}
        onClose={() => {
          setModalNote(null);
          fetchNotebook();
          fetchNotes();
        }}
      />

      <AddNotesToNotebookModal
        notebook={notebook}
        isOpen={showAddNotesModal}
        onClose={() => setShowAddNotesModal(false)}
        onNotesAdded={handleNotesAdded}
      />
    </div>
  );
}

export default NotebookDetailPage;
