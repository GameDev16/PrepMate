import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiFetch, apiJson } from '../lib/api';

function AddToNotebooksModal({ note, isOpen, onClose }) {
  const [allNotebooks, setAllNotebooks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      loadNotebooks();
    }
  }, [isOpen, note]);

  async function loadNotebooks() {
    setLoading(true);
    try {
      const [allRes, currentRes] = await Promise.all([
        apiFetch('/api/notebooks'),
        apiFetch(`/api/notes/${note.id}/notebooks`),
      ]);
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllNotebooks(allData.notebooks || []);
      }
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        setSelectedIds((currentData.notebooks || []).map((n) => n.id));
      }
    } catch (err) {
      console.error('Failed to load notebooks for modal:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleId(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiJson(`/api/notes/${note.id}/notebooks`, {
        method: 'PUT',
        body: JSON.stringify({ notebookIds: selectedIds }),
      });
      onClose();
    } catch (err) {
      console.error('Failed to update notebooks:', err);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen || !note) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-frost card-rounded p-6 max-w-md w-full shadow-hard relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl border-2 border-ink/20 hover:border-ink"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <h3 className="font-display font-normal text-2xl text-ink tracking-tight mb-1">
          Add to Notebooks
        </h3>
        <p className="text-xs text-ink/60 truncate mb-4">{note.title}</p>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-electric-iris border-t-transparent"></div>
          </div>
        ) : allNotebooks.length === 0 ? (
          <div className="text-center py-6 text-sm text-ink/60">
            No notebooks found. Create one from the Notebooks page!
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
            {allNotebooks.map((nb) => {
              const isChecked = selectedIds.includes(nb.id);
              return (
                <label
                  key={nb.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isChecked
                      ? 'border-electric-iris bg-electric-iris/5 font-bold'
                      : 'border-ink/20 hover:border-ink/40 font-medium'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleId(nb.id)}
                    className="w-4 h-4 accent-electric-iris rounded cursor-pointer"
                  />
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: nb.color || "#2727e6" }}
                  />
                  <span className="truncate text-ink">{nb.name}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-chalk border-2 border-ink rounded-xl font-bold text-sm hover:bg-frost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-5 py-2 bg-electric-iris text-white font-bold rounded-xl text-sm shadow-hard-sm hover:translate-y-0.5 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddToNotebooksModal;
