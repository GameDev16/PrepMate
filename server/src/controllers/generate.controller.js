const { db } = require("../db");
const {
  users,
  pdfUploads,
  generatedNotes,
  notebookNotes,
  notebooks,
  transactions,
  generationHistory,
} = require("../db/schema");
const { eq, and, gt, sql, inArray } = require("drizzle-orm");
const { TEMPLATE_CONFIGS, buildAIPrompt } = require("../lib/ai-prompts");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1500, 3000]; // between attempts, not after the last one

const UNLIMITED_CREDIT_EMAILS = (process.env.UNLIMITED_CREDIT_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function callGeminiAPI(prompt) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, text: data.candidates?.[0]?.content?.parts?.[0]?.text || "" };
      }
    } catch (err) {
      console.error(`Gemini attempt ${attempt + 1} failed:`, err);
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
  return { success: false, text: "" };
}

function generateMockContent(template, upload, includeDiagrams, includeCharts) {
  const templateConfig = TEMPLATE_CONFIGS[template];
  const label = templateConfig?.label || template;
  const fileName = upload.fileName.replace(".pdf", "");

  if (template === "flashcards") {
    return JSON.stringify({
      flashcards: [
        {
          front: "What is the main concept discussed in this document?",
          back: "The main concept involves understanding core principles and their practical applications as outlined in the document.",
        },
        {
          front: "Define the key terminology used.",
          back: "Key terms include fundamental concepts, methodologies, and frameworks that form the basis of the subject matter.",
        },
        {
          front: "What are the practical applications?",
          back: "Practical applications include real-world problem solving, implementation strategies, and theoretical analysis.",
        },
      ],
    });
  }

  if (template === "mcq-generator") {
    return JSON.stringify({
      mcqs: [
        {
          question: "What is the primary purpose of this document?",
          options: [
            "To provide entertainment",
            "To educate on key concepts",
            "To sell a product",
            "To share personal stories",
          ],
          correct: 1,
          difficulty: "easy",
          explanation:
            "The document is educational in nature, focusing on teaching key concepts and principles.",
        },
        {
          question:
            "Which of the following best describes the methodology discussed?",
          options: [
            "Unstructured approach",
            "Systematic framework",
            "Random selection",
            "Historical analysis",
          ],
          correct: 1,
          difficulty: "medium",
          explanation:
            "The document outlines a systematic framework for understanding and applying the subject matter.",
        },
      ],
    });
  }

  let extraSections = "";
  if (includeDiagrams) {
    const safeGraphName = fileName.replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
    extraSections += `\n\n### Concept Architecture Diagram\n\`\`\`mermaid\ngraph TD\n  A[${safeGraphName}] --> B[Core Principles & Theory]\n  A --> C[Analytical Methodology]\n  B --> D[System Implementation]\n  C --> D\n\`\`\``;
  }
  if (includeCharts) {
    extraSections += `\n\n### Quantitative Performance Summary\n<CHARTS_JSON>\n[\n  {\n    "type": "bar",\n    "title": "System Throughput vs Baseline",\n    "labels": ["Baseline System", "Optimized Model", "Theoretical Max"],\n    "series": [{ "name": "Throughput (ops/sec)", "data": [1200, 4800, 5500] }]\n  }\n]\n</CHARTS_JSON>`;
  }

  return `# ${label}: ${fileName}

## Document Statistics

- **Source:** ${upload.fileName}
- **Pages:** ${upload.pageCount || "Unknown"}
- **Characters:** ${upload.extractedText?.length || 0}

## Executive Summary
A brief overview of the key concepts distilled from your document appears here.

### Key Concepts
- **Concept 1:** Important foundational principle and theoretical model
- **Concept 2:** Building block for structured analytical understanding
- **Concept 3:** Practical application area across real-world systems

### Detailed Analysis
The AI provides detailed explanations, step-by-step breakdowns, memory tricks, and practical applications based on your exact PDF content.${extraSections}
`;
}

async function generate(req, res) {
  try {
    const user = req.user;
    const {
      pdfUploadId,
      template,
      depth,
      persona,
      language,
      customPrompt,
      notebookId,
      notebookIds,
      includeDiagrams,
      includeCharts,
    } = req.body;

    // Check if user has unlimited credits
    const isUnlimited = UNLIMITED_CREDIT_EMAILS.includes(
      user.email.toLowerCase()
    );

    // Fetch current user credits from DB
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!isUnlimited && currentUser.credits <= 0) {
      return res.status(403).json({
        error: "No credits remaining. Each AI generation costs 1 credit.",
      });
    }

    if (!pdfUploadId || !template) {
      return res.status(400).json({ error: "pdfUploadId and template are required" });
    }

    // Validate template
    if (!TEMPLATE_CONFIGS[template]) {
      return res.status(400).json({ error: "Invalid template type" });
    }

    // Fetch and validate PDF upload
    const [upload] = await db
      .select()
      .from(pdfUploads)
      .where(and(eq(pdfUploads.id, pdfUploadId), eq(pdfUploads.userId, user.id)))
      .limit(1);

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    if (!upload.extractedText || upload.extractedText.length < 50) {
      return res.status(422).json({
        error: "Insufficient text content in the uploaded PDF",
      });
    }

    let content = "";
    let flashcards = null;
    let mcqs = null;
    let diagrams = null;
    let charts = null;

    const isMockMode = process.env.MOCK_MODE === "true" || !process.env.GEMINI_API_KEY;

    if (!isMockMode) {
      const prompt = buildAIPrompt({
        text: upload.extractedText,
        template,
        depth: depth || "standard",
        persona,
        language: language || "English",
        customPrompt,
        includeDiagrams: !!includeDiagrams,
        includeCharts: !!includeCharts,
      });

      const result = await callGeminiAPI(prompt);

      if (result.success) {
        content = result.text;
      } else {
        // Log failed generation — do NOT deduct a credit and do NOT insert generatedNotes
        await db.insert(generationHistory).values({
          userId: user.id,
          pdfUploadId,
          templateType: template,
          status: "failed",
          creditsUsed: 0,
          errorMessage: "AI generation failed after 3 attempts. Please try again in a moment.",
        });

        return res.status(502).json({ error: "AI generation failed after 3 attempts. Please try again in a moment." });
      }
    } else {
      // Mock content when MOCK_MODE=true or no API key
      content = generateMockContent(template, upload, !!includeDiagrams, !!includeCharts);
    }

    // Extract diagrams (Mermaid) safely line-by-line avoiding ReDoS non-greedy [\s\S]*? regex
    const extractedDiagrams = [];
    if (content && content.length <= 100000) {
      const lines = content.split('\n');
      let inMermaid = false;
      let currDiag = [];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l.startsWith('```mermaid')) {
          inMermaid = true;
          currDiag = [];
        } else if (inMermaid && l.startsWith('```')) {
          inMermaid = false;
          if (currDiag.length > 0) extractedDiagrams.push(currDiag.join('\n'));
        } else if (inMermaid) {
          if (currDiag.length < 500) currDiag.push(lines[i]);
        }
      }
    }
    if (extractedDiagrams.length > 0) {
      diagrams = extractedDiagrams;
    } else if (isMockMode && includeDiagrams) {
      diagrams = ["graph TD\n  A[Core Document Concept] --> B[Analysis & Process]\n  A --> C[Theory & Framework]\n  B --> D[Real-World Output]"];
    }

    // Extract charts (Recharts JSON) safely line-by-line avoiding ReDoS
    let chartsMatchText = null;
    if (content && content.includes('<CHARTS_JSON>') && content.includes('</CHARTS_JSON>')) {
      const startIdx = content.indexOf('<CHARTS_JSON>') + '<CHARTS_JSON>'.length;
      const endIdx = content.indexOf('</CHARTS_JSON>', startIdx);
      if (endIdx > startIdx && endIdx - startIdx < 50000) {
        chartsMatchText = content.substring(startIdx, endIdx);
      }
    }
    if (chartsMatchText) {
      try {
        let jsonStr = chartsMatchText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsedCharts = JSON.parse(jsonStr);
        if (Array.isArray(parsedCharts) && parsedCharts.length > 0) {
          charts = parsedCharts;
        }
      } catch (chartParseErr) {
        console.error("Failed to parse CHARTS_JSON:", chartParseErr);
      }
    } else if (isMockMode && includeCharts) {
      charts = [{
        type: "bar",
        title: "System Throughput vs Baseline",
        labels: ["Baseline System", "Optimized Model", "Theoretical Max"],
        series: [{ name: "Throughput (ops/sec)", data: [1200, 4800, 5500] }]
      }];
    }

    // Parse JSON for flashcards/mcqs
    if (template === "flashcards" || template === "mcq-generator") {
      try {
        let jsonStr = content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(jsonStr);
        if (template === "flashcards") {
          flashcards = parsed.flashcards || parsed;
        } else {
          mcqs = parsed.mcqs || parsed;
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        if (template === "flashcards") {
          flashcards = [];
        } else {
          mcqs = [];
        }
      }
    }

    // Deduct credit atomically right before inserting success record
    if (!isUnlimited) {
      const [updatedUser] = await db
        .update(users)
        .set({
          credits: sql`${users.credits} - 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, user.id), gt(users.credits, 0)))
        .returning({ credits: users.credits });

      if (!updatedUser) {
        return res.status(403).json({ error: "No credits remaining due to concurrent request." });
      }

      await db.insert(transactions).values({
        userId: user.id,
        type: "debit",
        amount: 1,
        description: `Generated ${TEMPLATE_CONFIGS[template].label} from ${upload.fileName}`,
      });
    }

    // Create generated note
    const fileName = upload.fileName.replace(".pdf", "");
    const [note] = await db
      .insert(generatedNotes)
      .values({
        userId: user.id,
        pdfUploadId,
        title: `${TEMPLATE_CONFIGS[template].label}: ${fileName}`,
        templateType: template,
        depthLevel: depth || "standard",
        persona: persona || null,
        outputLanguage: language || "English",
        content,
        flashcards,
        mcqs,
        diagrams,
        charts,
        customPrompt: customPrompt || null,
      })
      .returning();

    // Handle notebook membership via join table
    let nbsToLink = [];
    if (Array.isArray(notebookIds)) {
      nbsToLink = notebookIds;
    } else if (notebookId) {
      nbsToLink = [notebookId];
    } else if (upload.notebookId) {
      nbsToLink = [upload.notebookId];
    }

    if (nbsToLink.length > 0) {
      try {
        const validNbs = await db
          .select({ id: notebooks.id })
          .from(notebooks)
          .where(and(inArray(notebooks.id, nbsToLink), eq(notebooks.userId, user.id)));

        const insertRows = validNbs.map((nb) => ({
          noteId: note.id,
          notebookId: nb.id,
        }));

        if (insertRows.length > 0) {
          await db.insert(notebookNotes).values(insertRows);
        }
      } catch (nbErr) {
        console.error("Failed to link note to notebooks:", nbErr);
      }
    }

    // Record generation history
    await db.insert(generationHistory).values({
      userId: user.id,
      pdfUploadId,
      noteId: note.id,
      templateType: template,
      status: "success",
      creditsUsed: isUnlimited ? 0 : 1,
    });

    // Get updated user credits
    const [updatedUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return res.status(201).json({
      note,
      remainingCredits: updatedUser.credits,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { generate };
