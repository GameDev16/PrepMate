import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  X, FileQuestion, ArrowLeft, Maximize2, NotebookText, Star, Download, FileText,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import AddToNotebooksModal from "../components/AddToNotebooksModal";
import NoteTitleEditor from "../components/note-viewer/NoteTitleEditor";
import FlashcardViewer from "../components/note-viewer/FlashcardViewer";
import MCQViewer from "../components/note-viewer/MCQViewer";
import { renderMarkdownContent } from "../lib/markdownRenderer";
import { templateLabel, templateAccent } from "../lib/templateMeta";

function sanitizeExportedText(str) {
  if (!str) return "";
  // Strip ANSI terminal escape codes (\x1B[...) and dangerous bidirectional Unicode overrides (U+202A-U+202E, U+2066-U+2069)
  return String(str)
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g, "");
}

function escapeHtml(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function NoteViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Esc exits focus mode, same as the close button
  useEffect(() => {
    if (!focusMode) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setFocusMode(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusMode]);

  useEffect(() => {
    fetchNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchNote() {
    try {
      const response = await apiFetch(`/api/notes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setNote(data.note);
      } else {
        setError("Note not found");
      }
    } catch (err) {
      setError("Failed to load note");
    } finally {
      setLoading(false);
    }
  }

  async function toggleBookmark() {
    try {
      const response = await apiFetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBookmarked: !note.isBookmarked }),
      });

      if (response.ok) {
        setNote((prev) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  }

  function handleRenamed(newTitle) {
    setNote((prev) => ({ ...prev, title: newTitle }));
  }

  function exportMarkdown() {
    let cleanContent;
    if (isFlashcards && flashcards && flashcards.length > 0) {
      cleanContent = flashcards
        .map(
          (card, i) =>
            `## Card ${i + 1}\n\n**Q:** ${card.front}\n\n**A:** ${card.back}\n`,
        )
        .join("\n---\n\n");
    } else {
      cleanContent = sanitizeExportedText(note.content).replace(
        /[*_`\s]*<CHARTS_JSON>[*_`\s]*[\s\S]*?[*_`\s]*<\/CHARTS_JSON>[*_`\s]*/gi,
        "\n",
      );
    }
    const blob = new Blob([cleanContent], {
      type: "text/markdown;charset=utf-8",
    });
    downloadBlob(blob, `${note.title.replace(/[^a-zA-Z0-9_\-\.]/g, "_")}.md`);
  }

  async function exportPdf() {
    const html2pdf = (await import("html2pdf.js")).default;
    const pdfOptions = {
      margin: 10,
      filename: `${note.title}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    if (isFlashcards && flashcards && flashcards.length > 0) {
      // The on-screen viewer only renders one card at a time (it's a
      // click-to-flip carousel), so exporting the live DOM would only ever
      // capture whichever single card happened to be showing. Build every
      // card into an off-screen container instead, and export that.
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "-9999px";
      container.style.width = "700px";
      container.style.padding = "20px";
      container.style.fontFamily = "sans-serif";
      container.innerHTML = flashcards
        .map(
          (card, i) => `
            <div style="margin-bottom:20px;padding:16px;border:1px solid #ddd;border-radius:12px;">
              <p style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Card ${i + 1} of ${flashcards.length}</p>
              <p style="font-weight:600;margin-bottom:8px;">Q: ${escapeHtml(card.front)}</p>
              <p style="color:#333;">A: ${escapeHtml(card.back)}</p>
            </div>
          `,
        )
        .join("");
      document.body.appendChild(container);
      try {
        await html2pdf().set(pdfOptions).from(container).save();
      } finally {
        document.body.removeChild(container);
      }
      return;
    }

    const element = contentRef.current;
    if (!element) return;

    html2pdf().set(pdfOptions).from(element).save();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-iris border-t-transparent"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="text-center py-20">
        <FileQuestion size={44} strokeWidth={1.5} className="mx-auto mb-4 text-ink/30" />
        <h2 className="font-display font-bold text-xl text-ink mb-2">
          {error || "Note not found"}
        </h2>
        <button
          onClick={() => navigate("/library")}
          className="mt-4 px-6 py-2 bg-electric-iris text-white font-medium rounded-xl"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const label = templateLabel(note.templateType);
  const accent = templateAccent(note.templateType);

  const isFlashcards = note.templateType === "flashcards";
  const isMCQ = note.templateType === "mcq-generator";

  let flashcards = null;
  let mcqs = null;

  if (isFlashcards) {
    flashcards = note.flashcards;
    if (!flashcards && note.content) {
      try {
        const parsed = JSON.parse(note.content);
        flashcards = parsed.flashcards || parsed;
      } catch {
        flashcards = [];
      }
    }
  }

  if (isMCQ) {
    mcqs = note.mcqs;
    if (!mcqs && note.content) {
      try {
        const parsed = JSON.parse(note.content);
        mcqs = parsed.mcqs || parsed;
      } catch {
        mcqs = [];
      }
    }
  }

  const contentBody = isFlashcards ? (
    <FlashcardViewer flashcards={flashcards} />
  ) : isMCQ ? (
    <MCQViewer mcqs={mcqs} />
  ) : (
    <div className="space-y-4">{renderMarkdownContent(note.content)}</div>
  );

  if (focusMode) {
    // Full-viewport overlay (fixed + high z-index) sits on top of the
    // AppShell's sticky header/nav, so this is the whole "full screen study"
    // experience without needing to coordinate with AppShell itself.
    return (
      <div className="fixed inset-0 z-[100] bg-chalk overflow-y-auto">
        <div className="sticky top-0 z-10 bg-paper border-b border-frost px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${accent}`} />
            <h1 className="font-display font-normal text-lg sm:text-xl text-ink tracking-tight truncate">
              {note.title}
            </h1>
          </div>
          <button
            onClick={() => setFocusMode(false)}
            className="shrink-0 px-4 py-2 bg-paper border-2 border-ink font-medium rounded-xl shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 text-sm ml-4"
            title="Exit focus mode (Esc)"
          >
            <X size={16} strokeWidth={2.5} />
            Exit Focus Mode
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <div ref={contentRef}>{contentBody}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-frost rounded-lg transition-colors"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-3 h-3 rounded-full shrink-0 ${accent}`} />
                <NoteTitleEditor note={note} onRenamed={handleRenamed} />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-frost text-sm font-medium rounded-full">
                  {label}
                </span>
                {note.depthLevel && (
                  <span className="px-3 py-1 bg-powder-sky/30 text-sm font-medium rounded-full capitalize">
                    {note.depthLevel}
                  </span>
                )}
                {note.outputLanguage &&
                  note.outputLanguage !== "English" &&
                  note.outputLanguage !== "Same as PDF" && (
                    <span className="px-3 py-1 bg-hi-yellow/30 text-sm font-medium rounded-full">
                      {note.outputLanguage}
                    </span>
                  )}
              </div>
              {note.pdfFileName && (
                <p className="text-sm text-ink/60 mt-2 inline-flex items-center gap-1.5">
                  <FileText size={13} className="shrink-0" />
                  {note.pdfFileName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode(true)}
              title="Full-screen distraction-free reading"
              className="px-4 py-2 bg-frost border-2 border-ink/20 hover:border-ink font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <Maximize2 size={15} />
              Focus Mode
            </button>

            <button
              onClick={() => setIsNotebookModalOpen(true)}
              className="px-4 py-2 bg-frost border-2 border-ink/20 hover:border-ink font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <NotebookText size={15} />
              Notebooks
            </button>

            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg transition-colors border-2 border-transparent ${
                note.isBookmarked
                  ? "text-hi-yellow bg-hi-yellow/10 border-hi-yellow/30"
                  : "text-ink/30 hover:text-hi-yellow"
              }`}
              title="Bookmark"
            >
              <Star size={20} fill={note.isBookmarked ? "currentColor" : "none"} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-paper border-2 border-ink font-medium rounded-xl shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 text-sm"
              >
                <Download size={15} />
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-paper border-2 border-ink rounded-xl shadow-hard overflow-hidden z-10 min-w-[150px]">
                  <button
                    onClick={() => {
                      exportMarkdown();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-frost transition-colors text-sm font-medium"
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => {
                      exportPdf();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-frost transition-colors text-sm font-medium"
                  >
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-paper border border-frost card-rounded p-6 sm:p-8 shadow-hard">
        <div ref={contentRef}>{contentBody}</div>
      </div>

      <AddToNotebooksModal
        note={note}
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
      />
    </div>
  );
}

export default NoteViewerPage;
