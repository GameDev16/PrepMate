const TEMPLATE_CONFIGS = {
  "long-form-notes": {
    label: "Long Form Notes",
    description: "Detailed explanations with examples and applications",
    systemPrompt: `Generate comprehensive long-form study notes. Include:
- Executive Summary
- Learning Objectives
- Core Concepts with detailed explanations
- Real-world Examples and Applications
- Important Facts and Key Terminology
- Memory Tricks and Common Mistakes
- Further Reading suggestions
Format using clear Markdown headings and subheadings.`,
  },
  "concise-notes": {
    label: "Concise Notes",
    description: "Short notes with important concepts only",
    systemPrompt: `Generate concise study notes focusing only on the most important concepts. Be brief but complete. Use bullet points where appropriate. Include key definitions and formulae.`,
  },
  "revision-notes": {
    label: "Revision Notes",
    description: "Exam-oriented with definitions, keywords, formulae",
    systemPrompt: `Generate exam-oriented revision notes. Include:
- Key Definitions
- Important Keywords
- Formulae and Equations
- Critical Facts
- Quick Reference Tables
No unnecessary explanations. Focus on what's most likely to appear in exams.`,
  },
  "bullet-points": {
    label: "Bullet Point Notes",
    description: "Entire document in organized bullet points",
    systemPrompt: `Convert the entire document into well-organized, hierarchical bullet points. Group related concepts together. Use clear, concise language.`,
  },
  "qa-mode": {
    label: "Q&A Mode",
    description: "Every concept as Question → Answer",
    systemPrompt: `Convert every concept into Question and Answer format. Format each as:
## Q: [Question]
**A:** [Detailed Answer]
Perfect for theory exam preparation. Cover all major concepts.`,
  },
  flashcards: {
    label: "Flashcards",
    description: "Front/Back cards for spaced repetition",
    systemPrompt: `Generate flashcards in JSON format. Return a JSON object with a "flashcards" array where each item has "front" (question) and "back" (answer) properties. Generate 15-25 flashcards covering all key concepts. Return ONLY valid JSON, no markdown.`,
  },
  "cheat-sheet": {
    label: "Cheat Sheet",
    description: "One-page quick revision",
    systemPrompt: `Create a one-page cheat sheet. Be extremely concise. Use tables, short definitions, and formulae. This should fit on a single printed page and serve as a quick reference during revision.`,
  },
  "teacher-notes": {
    label: "Teacher Notes",
    description: "With examples, analogies, and memory tricks",
    systemPrompt: `Explain concepts as a skilled teacher would. Use:
- Simple language
- Real-world analogies
- Memorable examples
- Memory tricks (mnemonics)
- Step-by-step explanations
Make complex topics easy to understand.`,
  },
  "beginner-mode": {
    label: "Beginner Mode",
    description: "Assumes zero prior knowledge",
    systemPrompt: `Explain everything assuming the reader has zero prior knowledge. Start from absolute basics. Use simple language, everyday analogies, and build concepts step by step. Avoid jargon unless explained first.`,
  },
  "advanced-mode": {
    label: "Advanced Mode",
    description: "Academic terminology for advanced students",
    systemPrompt: `Generate advanced-level academic notes. Maintain proper terminology. Include theoretical foundations, proofs where applicable, edge cases, and advanced applications. Suitable for engineering and postgraduate students.`,
  },
  "interview-prep": {
    label: "Interview Prep",
    description: "Interview questions with expected answers",
    systemPrompt: `Generate interview preparation material:
- Common Interview Questions on these topics
- Expected Answers (detailed)
- Follow-up Questions an interviewer might ask
- Common Mistakes candidates make
- Tips for answering effectively`,
  },
  "mind-map": {
    label: "Mind Map",
    description: "Hierarchical concept maps using Mermaid",
    systemPrompt: `Generate a mind map representation. Create 2-3 Mermaid.js diagrams (mindmap or graph type) showing concept relationships. Also provide a text-based hierarchical outline. Format Mermaid code in \`\`\`mermaid code blocks.`,
  },
  "comparison-mode": {
    label: "Comparison Tables",
    description: "Compare concepts with pros/cons",
    systemPrompt: `Generate comparison tables for related concepts. Include:
- Feature-by-feature comparison tables
- Advantages and Disadvantages
- Key Differences
- Use Cases and When to use what
Use Markdown tables.`,
  },
  "formula-sheet": {
    label: "Formula Sheet",
    description: "Extract formulae, equations, variables",
    systemPrompt: `Extract and organize all formulae, equations, and mathematical expressions. Include:
- Formula name
- The formula/equation
- Variables and their meanings
- Units
- Applications and when to use each formula`,
  },
  "mcq-generator": {
    label: "MCQ Generator",
    description: "Multiple choice questions with explanations",
    systemPrompt: `Generate MCQs in JSON format. Return a JSON object with an "mcqs" array where each item has: "question", "options" (array of 4 strings), "correct" (index 0-3), "difficulty" ("easy"|"medium"|"hard"), and "explanation". Generate 15-20 MCQs of varying difficulty. Return ONLY valid JSON, no markdown.`,
  },
  "timeline-mode": {
    label: "Timeline",
    description: "Chronological representation of events/processes",
    systemPrompt: `Create a chronological timeline or process flow. Use Mermaid.js timeline or sequence diagrams where appropriate. Also provide a structured textual timeline. Format Mermaid code in \`\`\`mermaid code blocks.`,
  },
  "case-study": {
    label: "Case Study",
    description: "Business, law, medicine case analysis",
    systemPrompt: `Analyze the content as case studies. Include:
- Case Background
- Key Issues/Problems
- Analysis
- Solutions/Recommendations
- Lessons Learned
- Discussion Questions`,
  },
  "viva-mode": {
    label: "Viva Preparation",
    description: "Professor-style oral exam questions",
    systemPrompt: `Generate viva/oral examination preparation material:
- Questions a professor would ask
- Expected depth of answers
- Follow-up questions
- Tricky questions to watch out for
- How to structure your verbal answers`,
  },
};

const DEPTH_CONFIGS = {
  "ultra-short": { label: "Ultra Short", wordLimit: "~100 words" },
  short: { label: "Short", wordLimit: "~500 words" },
  standard: { label: "Standard", wordLimit: "~1000 words" },
  detailed: { label: "Detailed", wordLimit: "~3000 words" },
  comprehensive: {
    label: "Comprehensive",
    wordLimit: "no word limit, be thorough",
  },
};

const PERSONA_CONFIGS = {
  professor: {
    label: "Professor",
    instruction:
      "Explain as a university professor would, with academic rigor and depth.",
  },
  "school-teacher": {
    label: "School Teacher",
    instruction:
      "Explain as a patient school teacher, using simple language and step-by-step guidance.",
  },
  researcher: {
    label: "Researcher",
    instruction:
      "Analyze as a researcher, citing evidence, noting limitations, and suggesting further investigation.",
  },
  "software-engineer": {
    label: "Software Engineer",
    instruction:
      "Explain with practical coding examples, system design perspectives, and real-world applications.",
  },
  "upsc-mentor": {
    label: "UPSC Mentor",
    instruction:
      "Frame content for UPSC preparation: facts, analysis, current relevance, and mains answer writing perspective.",
  },
  eli5: {
    label: "Explain Like I'm 5",
    instruction:
      "Explain as simply as possible, as if to a 5-year-old, using everyday analogies and very simple words.",
  },
};

const SUPPORTED_LANGUAGES = [
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

function buildAIPrompt({
  text,
  template,
  depth,
  persona,
  language,
  customPrompt,
  includeDiagrams,
  includeCharts,
}) {
  const templateConfig = TEMPLATE_CONFIGS[template];
  const depthConfig = DEPTH_CONFIGS[depth] || DEPTH_CONFIGS["standard"];
  const personaConfig = persona ? PERSONA_CONFIGS[persona] : null;
  const isJsonTemplate =
    template === "flashcards" || template === "mcq-generator";

  let prompt = `You are an AI Study Assistant that transforms educational documents into high-quality study material.

TASK: ${templateConfig?.systemPrompt || "Generate comprehensive study notes."}

OUTPUT LENGTH: Target approximately ${depthConfig.wordLimit}.
`;

  if (personaConfig) {
    prompt += `\nPERSONA: ${personaConfig.instruction}\n`;
  }

  if (language && language !== "Same as PDF") {
    prompt += `\nOUTPUT LANGUAGE: Generate all content in ${language}. However, preserve technical terminology (like "Binary Tree", "Stack", "TCP/IP", "SQL", etc.) in their original English form unless the user specifically requests translation.\n`;
  }

  if (customPrompt) {
    prompt += `\nADDITIONAL INSTRUCTIONS: ${customPrompt}\n`;
  }

  if (includeDiagrams) {
    prompt += `\nDIAGRAMS: Provide 1 to 3 Mermaid.js diagrams illustrating relationships, flows, or concepts from the text. Place each diagram immediately after the section or heading it supports, and format every diagram block cleanly using \`\`\`mermaid and \`\`\` code block fences so it remains inline with the surrounding content.
Follow these syntax rules exactly, since even one violation breaks the renderer:
- Wrap any node label that contains spaces, punctuation, parentheses, colons, slashes, or quotes in double quotes, e.g. A["Response (2xx)"] rather than A[Response (2xx)].
- Never use raw parentheses, colons, or double quotes inside an unquoted label.
- Keep labels short (under ~6 words) and avoid line breaks inside a label.
- Only use diagram syntax you are fully confident is valid for that diagram type (flowchart/graph, sequenceDiagram, classDiagram, mindmap, timeline). If unsure a diagram will parse correctly, prefer a simpler flowchart instead.
- Before moving on, mentally check that every bracket, parenthesis, and quote you opened in the diagram is closed.\n`;
  }

  if (includeCharts) {
    prompt += `\nCHARTS: Only include a chart where the document itself contains genuine countable, measured, or comparable numbers worth visualizing (explicit statistics, counts, percentages, before/after or option-by-option comparisons, durations, etc.). Every number in a chart must come directly from, or be directly derivable from, the source document — never invent, estimate, or guess plausible-sounding figures just to produce a chart. If a section has real chartable data, place that chart immediately after the section it illustrates, as a JSON block enclosed exactly between <CHARTS_JSON> and </CHARTS_JSON> tags containing an array of chart objects matching this exact schema: [{"type": "bar"|"line"|"pie", "title": "Chart Title", "labels": ["Label1", "Label2"], "series": [{"name": "Series 1", "data": [10, 20]}]}]. If the document has no genuine quantitative data anywhere, it is completely fine to include zero charts — do not fabricate one to satisfy this instruction. Likewise, if several sections each have real data, include a chart for each rather than stopping at one.\n`;
  }

  prompt += isJsonTemplate
    ? `\nIMPORTANT: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanatory text before or after the JSON. Start with { and end with }.`
    : `\nIMPORTANT: Format output in clean Markdown. Use proper headings (##, ###), bullet points, tables, and code blocks where appropriate.`;

  prompt += `\n\n---\nDOCUMENT CONTENT:\n${text.substring(0, 80000)}\n---`;

  return prompt;
}

module.exports = {
  TEMPLATE_CONFIGS,
  DEPTH_CONFIGS,
  PERSONA_CONFIGS,
  SUPPORTED_LANGUAGES,
  buildAIPrompt,
};
