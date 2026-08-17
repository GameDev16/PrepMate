export const TEMPLATE_CONFIGS = {
  "long-form-notes": {
    label: "Long Form Notes",
    description: "Detailed explanations with examples and applications",
  },
  "concise-notes": {
    label: "Concise Notes",
    description: "Short notes with important concepts only",
  },
  "revision-notes": {
    label: "Revision Notes",
    description: "Exam-oriented with definitions, keywords, formulae",
  },
  "bullet-points": {
    label: "Bullet Point Notes",
    description: "Entire document in organized bullet points",
  },
  "qa-mode": {
    label: "Q&A Mode",
    description: "Every concept as Question → Answer",
  },
  flashcards: {
    label: "Flashcards",
    description: "Front/Back cards for spaced repetition",
  },
  "cheat-sheet": {
    label: "Cheat Sheet",
    description: "One-page quick revision",
  },
  "teacher-notes": {
    label: "Teacher Notes",
    description: "With examples, analogies, and memory tricks",
  },
  "beginner-mode": {
    label: "Beginner Mode",
    description: "Assumes zero prior knowledge",
  },
  "advanced-mode": {
    label: "Advanced Mode",
    description: "Academic terminology for advanced students",
  },
  "interview-prep": {
    label: "Interview Prep",
    description: "Interview questions with expected answers",
  },
  "mind-map": {
    label: "Mind Map",
    description: "Hierarchical concept maps using Mermaid",
  },
  "comparison-mode": {
    label: "Comparison Tables",
    description: "Compare concepts with pros/cons",
  },
  "formula-sheet": {
    label: "Formula Sheet",
    description: "Extract formulae, equations, variables",
  },
  "mcq-generator": {
    label: "MCQ Generator",
    description: "Multiple choice questions with explanations",
  },
  "timeline-mode": {
    label: "Timeline",
    description: "Chronological representation of events/processes",
  },
  "case-study": {
    label: "Case Study",
    description: "Business, law, medicine case analysis",
  },
  "viva-mode": {
    label: "Viva Preparation",
    description: "Professor-style oral exam questions",
  },
};

export const DEPTH_CONFIGS = {
  "ultra-short": { label: "Ultra Short", wordLimit: "~100 words" },
  short: { label: "Short", wordLimit: "~500 words" },
  standard: { label: "Standard", wordLimit: "~1000 words" },
  detailed: { label: "Detailed", wordLimit: "~3000 words" },
  comprehensive: { label: "Comprehensive", wordLimit: "no limit" },
};

export const PERSONA_CONFIGS = {
  professor: { label: "Professor" },
  "school-teacher": { label: "School Teacher" },
  researcher: { label: "Researcher" },
  "software-engineer": { label: "Software Engineer" },
  "upsc-mentor": { label: "UPSC Mentor" },
  eli5: { label: "Explain Like I'm 5" },
};

export const SUPPORTED_LANGUAGES = [
  "Same as PDF",
  "English",
  "Hindi",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Bengali",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Spanish",
  "French",
  "German",
  "Japanese",
];

export const STATUS_MESSAGES = [
  "Reading your PDF...",
  "Understanding content...",
  "Structuring notes...",
  "Creating study material...",
  "Preparing final output...",
  "Almost done...",
];
