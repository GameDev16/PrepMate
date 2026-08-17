import React, { useState, useRef, useEffect } from "react";
import { Check, X, Pencil } from "lucide-react";
import { apiFetch } from "../../lib/api";

// Inline rename control for a note's title. Renaming writes straight to the
// generatedNotes.title column via PATCH /api/notes/:id, which is the single
// place every other view (Library, Notebooks, Dashboard recents, History)
// reads a note's title from — so a rename here is automatically reflected
// everywhere else the next time those views fetch, with no extra plumbing.
function NoteTitleEditor({ note, onRenamed }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setDraft(note.title);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(note.title);
    setError(null);
  }

  async function saveTitle() {
    const trimmed = draft.trim();

    if (!trimmed) {
      setError("Title can't be empty");
      return;
    }
    if (trimmed === note.title) {
      setIsEditing(false);
      return;
    }
    if (trimmed.length > 500) {
      setError("Title is too long (max 500 characters)");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });

      if (response.ok) {
        const data = await response.json();
        onRenamed(data.note?.title ?? trimmed);
        setIsEditing(false);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Failed to rename note");
      }
    } catch (err) {
      setError("Failed to rename note");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  }

  if (isEditing) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            maxLength={500}
            className="font-display font-normal text-[28px] text-ink tracking-tight bg-chalk border-b-2 border-electric-iris focus:outline-none px-1 py-0.5 w-full max-w-xl disabled:opacity-60"
          />
          <button
            onClick={saveTitle}
            disabled={saving}
            title="Save"
            className="p-2 text-jelly-green hover:bg-jelly-green/10 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {saving ? "…" : <Check size={18} strokeWidth={2.75} />}
          </button>
          <button
            onClick={cancelEditing}
            disabled={saving}
            title="Cancel"
            className="p-2 text-ink/50 hover:bg-frost rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        {error && <p className="text-marker-red text-sm mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group/title">
      <h1 className="font-display font-normal text-[28px] text-ink tracking-tight">
        {note.title}
      </h1>
      <button
        onClick={startEditing}
        title="Rename note"
        className="p-1.5 text-ink/30 hover:text-electric-iris hover:bg-frost rounded-lg transition-colors opacity-0 group-hover/title:opacity-100 focus:opacity-100"
      >
        <Pencil size={15} />
      </button>
    </div>
  );
}

export default NoteTitleEditor;
