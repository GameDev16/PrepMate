import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, Pin, Trash2, X, NotebookText } from "lucide-react";
import { apiFetch } from "../lib/api";
import AddNotesToNotebookModal from "../components/AddNotesToNotebookModal";

const COLOR_OPTIONS = [
  "#6366f1",
  "#2727e6",
  "#16ab59",
  "#ff4141",
  "#ffda00",
  "#91d8ec",
  "#ffbac4",
  "#111118",
];

function NotebooksPage() {
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);
  const [activeNotebook, setActiveNotebook] = useState(null);

  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formDescription, setFormDescription] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  async function fetchNotebooks() {
    try {
      const response = await apiFetch("/api/notebooks");
      if (response.ok) {
        const data = await response.json();
        setNotebooks(data.notebooks || []);
      } else {
        setError("Failed to load notebooks");
      }
    } catch (err) {
      setError("Failed to load notebooks");
    } finally {
      setLoading(false);
    }
  }

  async function createNotebook(e) {
    e.preventDefault();
    if (!formName.trim()) return;

    setFormSubmitting(true);
    try {
      const response = await apiFetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          emoji: "",
          color: formColor,
          description: formDescription.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotebooks((prev) => [...prev, { ...data.notebook, noteCount: 0 }]);
        closeModal();
      }
    } catch (err) {
      console.error("Failed to create notebook:", err);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function togglePin(notebookId, currentState) {
    try {
      const response = await apiFetch(`/api/notebooks/${notebookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentState }),
      });

      if (response.ok) {
        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === notebookId ? { ...nb, isPinned: !currentState } : nb,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  }

  async function deleteNotebook(notebookId) {
    if (
      !confirm(
        "Are you sure you want to delete this notebook? Notes inside will be kept.",
      )
    )
      return;

    try {
      const response = await apiFetch(`/api/notebooks/${notebookId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotebooks((prev) => prev.filter((nb) => nb.id !== notebookId));
      }
    } catch (err) {
      console.error("Failed to delete notebook:", err);
    }
  }

  function closeModal() {
    setShowModal(false);
    setFormName("");
    setFormColor("#6366f1");
    setFormDescription("");
  }

  function openAddNotesModal(notebook) {
    setActiveNotebook(notebook);
    setShowAddNotesModal(true);
  }

  function closeAddNotesModal() {
    setShowAddNotesModal(false);
    setActiveNotebook(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-iris border-t-transparent"></div>
      </div>
    );
  }

  const sortedNotebooks = [...notebooks].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-3xl sm:text-[42px] text-ink tracking-tight">
            Notebooks
          </h1>
          <p className="text-base text-ink/70 mt-1 font-normal">
            Organize and categorize your chapters across custom subjects
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-electric-iris text-white font-normal rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>New Notebook</span>
        </button>
      </div>

      {sortedNotebooks.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotebooks.map((notebook) => (
            <div
              key={notebook.id}
              className="bg-paper border border-frost rounded-[24px] overflow-hidden shadow-hard-sm hover:-translate-y-1 hover:shadow-hard transition-all group flex flex-col justify-between"
            >
              <Link to={`/notebooks/${notebook.id}`} className="block">
                <div
                  className="h-2.5 w-full"
                  style={{ backgroundColor: notebook.color }}
                />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <NotebookText size={30} strokeWidth={1.75} style={{ color: notebook.color }} />
                    {notebook.isPinned && (
                      <span className="px-3 py-1 bg-hi-yellow text-ink text-xs font-mono uppercase tracking-wider rounded-full inline-flex items-center gap-1">
                        <Pin size={11} fill="currentColor" />
                        Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-normal text-2xl text-ink mb-2 tracking-tight">
                    {notebook.name}
                  </h3>
                  {notebook.description && (
                    <p className="text-base text-ink/70 mb-4 line-clamp-2 font-normal leading-relaxed">
                      {notebook.description}
                    </p>
                  )}
                  <p className="text-xs font-mono text-ink/60 mb-6">
                    {notebook.noteCount || 0} note
                    {(notebook.noteCount || 0) !== 1 ? "s" : ""} inside
                  </p>
                </div>
              </Link>

              <div className="px-6 pb-6 flex items-center gap-2 border-t border-frost pt-4">
                <Link
                  to={`/notebooks/${notebook.id}`}
                  className="flex-1 px-4 py-2.5 bg-electric-iris text-white font-normal text-center rounded-full shadow-hard-sm hover:translate-y-0.5 transition-all text-sm inline-flex items-center justify-center gap-1.5"
                >
                  View Notes
                  <ArrowRight size={14} />
                </Link>
                <button
                  onClick={() => openAddNotesModal(notebook)}
                  className="px-3 py-2.5 border border-frost rounded-full hover:border-electric-iris hover:text-electric-iris transition-colors text-sm inline-flex items-center gap-1.5"
                  title="Add Notes"
                >
                  <Plus size={14} />
                  Add notes
                </button>
                <button
                  onClick={() => togglePin(notebook.id, notebook.isPinned)}
                  className="p-2.5 border border-frost rounded-full hover:border-electric-iris transition-colors"
                  title={notebook.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin size={16} fill={notebook.isPinned ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => deleteNotebook(notebook.id)}
                  className="p-2.5 border border-frost rounded-full hover:border-marker-red hover:text-marker-red transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-paper border border-frost rounded-[24px] p-12 shadow-hard text-center">
          <NotebookText size={44} strokeWidth={1.5} className="mx-auto mb-4 text-ink/30" />
          <h2 className="font-display font-normal text-2xl text-ink mb-2 tracking-tight">
            No notebooks created yet
          </h2>
          <p className="text-base text-ink/70 mb-8 max-w-md mx-auto leading-relaxed">
            Create your first creative notebook to keep all your generated
            summaries, flashcards, and quizzes sorted.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-electric-iris text-white font-normal rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all text-lg"
          >
            <span>Create Notebook</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      <AddNotesToNotebookModal
        notebook={activeNotebook}
        isOpen={showAddNotesModal}
        onClose={closeAddNotesModal}
        onNotesAdded={fetchNotebooks}
      />

      {showModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-paper border border-frost rounded-[24px] p-8 w-full max-w-md shadow-hard relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-normal text-2xl text-ink tracking-tight">
                New Notebook
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-frost rounded-full transition-colors text-ink"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={createNotebook} className="space-y-6">
              <div>
                <label className="block text-sm font-normal text-ink mb-2">
                  Subject name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 bg-chalk border border-frost rounded-full focus:outline-none focus:ring-2 focus:ring-electric-iris text-ink font-normal"
                  placeholder="e.g. Neuroscience & Cognitive Architecture"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-ink mb-2">
                  Accent color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-10 h-10 rounded-full border transition-all ${
                        formColor === color
                          ? "border-ink ring-2 ring-electric-iris ring-offset-2 scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-normal text-ink mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-5 py-3.5 bg-chalk border border-frost rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-iris resize-none text-ink font-normal"
                  placeholder="What's this notebook focused on?"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3.5 bg-transparent border border-ink text-ink font-normal rounded-full hover:bg-frost transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || !formName.trim()}
                  className="flex-1 py-3.5 bg-electric-iris text-white font-normal rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotebooksPage;
