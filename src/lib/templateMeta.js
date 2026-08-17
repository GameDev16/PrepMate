// Single source of truth for template display labels on the frontend.
// Previously this exact object (with an emoji per template) was copy-pasted
// independently into LibraryPage, NotebookDetailPage, HistoryPage, and
// NoteViewerPage — four separate places that could silently drift out of
// sync. No icon per template: in a dense list/badge context, bold
// typography carries the label better than 18 different pictograms would.
export const TEMPLATE_LABELS = {
  "long-form-notes": "Long Form Notes",
  "concise-notes": "Concise Notes",
  "revision-notes": "Revision Notes",
  "bullet-points": "Bullet Points",
  "qa-mode": "Q&A Mode",
  flashcards: "Flashcards",
  "cheat-sheet": "Cheat Sheet",
  "teacher-notes": "Teacher Notes",
  "beginner-mode": "Beginner Mode",
  "advanced-mode": "Advanced Mode",
  "interview-prep": "Interview Prep",
  "mind-map": "Mind Map",
  "comparison-mode": "Comparison Tables",
  "formula-sheet": "Formula Sheet",
  "mcq-generator": "MCQ Generator",
  "timeline-mode": "Timeline",
  "case-study": "Case Study",
  "viva-mode": "Viva Preparation",
};

export function templateLabel(templateType) {
  return TEMPLATE_LABELS[templateType] || templateType;
}

// Deterministic accent color per template (by key, not index) — used as a
// small left-border/dot instead of a bespoke icon, so template badges stay
// visually distinct without needing 18 different pictograms.
const ACCENT_COLORS = [
  "bg-electric-iris", "bg-jelly-green", "bg-marker-red",
  "bg-hi-yellow", "bg-powder-sky", "bg-bubblegum",
];

export function templateAccent(templateType) {
  const keys = Object.keys(TEMPLATE_LABELS);
  const i = keys.indexOf(templateType);
  return ACCENT_COLORS[(i >= 0 ? i : 0) % ACCENT_COLORS.length];
}
