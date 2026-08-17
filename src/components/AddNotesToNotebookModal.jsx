import React, { useState, useEffect } from "react";
import { X, Check, Plus } from "lucide-react";
import { apiFetch, apiJson } from "../lib/api";
import { templateLabel } from "../lib/templateMeta";

function AddNotesToNotebookModal({ notebook, isOpen, onClose, onNotesAdded }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedNoteIds, setAddedNoteIds] = useState([]);
  const [anyAdded, setAnyAdded] = useState(false);

  useEffect(() => {
    if (isOpen && notebook) {
      setSearchTerm("");
      setAnyAdded(false);
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, notebook]);

  async function loadNotes() {
    setLoading(true);
    try {
      const [allRes, currentRes] = await Promise.all([
        apiFetch("/api/notes"),
        apiFetch(`/api/notes?notebookId=${notebook.id}`),
      ]);
      if (allRes.ok) {
        const allData = await allRes.json();
        setSearchResults(allData.notes || []);
      }
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        setAddedNoteIds((currentData.notes || []).map((n) => n.id));
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function searchNotes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const response = await apiFetch(`/api/notes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.notes || []);
      }
    } catch (err) {
      console.error("Failed to search notes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addNoteToNotebook(noteId) {
    try {
      const currentRes = await apiFetch(`/api/notes/${noteId}/notebooks`);
      let existingIds = [];
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        existingIds = (currentData.notebooks || []).map((nb) => nb.id);
      }

      const mergedIds = [...new Set([...existingIds, notebook.id])];
      const response = await apiJson(`/api/notes/${noteId}/notebooks`, {
        method: "PUT",
        body: JSON.stringify({ notebookIds: mergedIds }),
      });

      if (response.ok) {
        setAddedNoteIds((prev) => [...prev, noteId]);
        setAnyAdded(true);
      }
    } catch (err) {
      console.error("Failed to add note to notebook:", err);
    }
  }

  function handleClose() {
    if (anyAdded) onNotesAdded?.();
    onClose();
  }

  if (!isOpen || !notebook) return null;

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="bg-paper border border-frost rounded-[24px] p-8 w-full max-w-lg shadow-hard relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-normal text-2xl text-ink tracking-tight">
              Add notes to {notebook.name}
            </h2>
            <p className="text-sm text-ink/70 mt-1">
              Browse your notes and add them individually, or search to
              filter.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-frost rounded-full transition-colors text-ink"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), searchNotes())
            }
            placeholder="Search notes by title or content"
            className="flex-1 px-4 py-3 bg-chalk border border-frost rounded-full focus:outline-none focus:ring-2 focus:ring-electric-iris text-ink"
          />
          <button
            onClick={searchNotes}
            disabled={loading}
            className="px-4 py-3 bg-electric-iris text-white rounded-full shadow-hard-sm hover:translate-y-0.5 transition-all disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-electric-iris border-t-transparent"></div>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((note) => {
              const alreadyAdded = addedNoteIds.includes(note.id);
              return (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-3 p-3 border border-frost rounded-2xl bg-chalk/70"
                >
                  <div>
                    <p className="font-medium text-ink">{note.title}</p>
                    <p className="text-xs text-ink/60 mt-1">
                      {note.templateType ? templateLabel(note.templateType) : "Generated note"}
                    </p>
                  </div>
                  <button
                    onClick={() => addNoteToNotebook(note.id)}
                    disabled={alreadyAdded}
                    title={
                      alreadyAdded
                        ? "Already in this notebook"
                        : "Add to notebook"
                    }
                    className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full border transition-all disabled:cursor-not-allowed ${
                      alreadyAdded
                        ? "border-electric-iris bg-electric-iris/10 text-electric-iris"
                        : "border-electric-iris text-electric-iris hover:bg-electric-iris/10"
                    }`}
                  >
                    {alreadyAdded ? <Check size={16} strokeWidth={2.75} /> : <Plus size={16} strokeWidth={2.75} />}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-sm text-ink/60">
              {searchTerm.trim()
                ? "No notes match your search."
                : "You don't have any notes yet — upload a PDF to generate some."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddNotesToNotebookModal;
