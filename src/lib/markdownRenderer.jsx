import React from "react";
import MermaidViewer from "../components/note-viewer/MermaidViewer";
import RechartsViewer from "../components/note-viewer/RechartsViewer";

export function escapeHtml(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

export function parseMarkdownContent(markdown) {
  if (!markdown) return { html: "", mermaidBlocks: [], chartBlocks: [] };

  const chartBlocks = [];

  // Extract <CHARTS_JSON>...</CHARTS_JSON> blocks with a resilient, whole-string
  // regex pass rather than requiring the tag to sit alone at the start of a line.
  // The line-anchored approach used to let raw JSON leak straight into the
  // rendered note whenever the AI's formatting drifted even slightly (extra
  // markup touching the tag, or the block getting cut off mid-generation).
  let withoutCharts = String(markdown).replace(
    /[*_`\s]*<CHARTS_JSON>[*_`\s]*([\s\S]*?)[*_`\s]*<\/CHARTS_JSON>[*_`\s]*/gi,
    (_match, body) => {
      const parsedCharts = parseChartBlock(body);
      chartBlocks.push(...parsedCharts);
      return `\n__CHART_PLACEHOLDER_${chartBlocks.length - 1}__\n`;
    },
  );
  // A dangling opening tag with no matching close means generation was cut off
  // before finishing the block — drop it instead of showing incomplete raw JSON.
  withoutCharts = withoutCharts.replace(/[*_`\s]*<CHARTS_JSON>[\s\S]*$/gi, "");

  const lines = withoutCharts.split("\n");
  const processedLines = [];
  const mermaidBlocks = [];

  let inCodeBlock = false;
  let codeBlockLines = [];
  let isMermaidBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (inCodeBlock) {
      if (line === "```") {
        inCodeBlock = false;
        if (isMermaidBlock) {
          mermaidBlocks.push(codeBlockLines.join("\n"));
          processedLines.push(
            `__MERMAID_PLACEHOLDER_${mermaidBlocks.length - 1}__`,
          );
        } else {
          processedLines.push(
            `<pre class="bg-ink text-white p-4 rounded-xl overflow-x-auto my-4"><code class="font-mono text-sm">${codeBlockLines.join("\n").trim()}</code></pre>`,
          );
        }
        codeBlockLines = [];
        isMermaidBlock = false;
      } else {
        codeBlockLines.push(rawLine);
      }
      continue;
    }

    if (line.startsWith("```")) {
      inCodeBlock = true;
      isMermaidBlock = line.trim() === "```mermaid";
      codeBlockLines = [];

      continue;
    }

    processedLines.push(rawLine);
  }

  if (inCodeBlock && isMermaidBlock) {
    mermaidBlocks.push(codeBlockLines.join("\n"));
    processedLines.push(`__MERMAID_PLACEHOLDER_${mermaidBlocks.length - 1}__`);
  }

  return { html: processedLines.join("\n"), mermaidBlocks, chartBlocks };
}

export function parseChartBlock(raw) {
  if (!raw) return [];
  try {
    let jsonStr = raw
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();
    // Tolerate stray characters right around the JSON (leftover markdown
    // emphasis markers, etc.) by trimming down to the outermost [ ... ] or { ... }.
    const start = jsonStr.search(/[[{]/);
    const end = Math.max(jsonStr.lastIndexOf("]"), jsonStr.lastIndexOf("}"));
    if (start !== -1 && end !== -1 && end > start) {
      jsonStr = jsonStr.slice(start, end + 1);
    }
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    return [];
  }
}

export function markdownToHtml(markdown) {
  if (!markdown) return "";

  const { html } = parseMarkdownContent(markdown);
  let processedHtml = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  processedHtml = processedHtml.replace(
    /^### (.+)$/gm,
    '<h3 class="text-lg font-bold text-ink mt-6 mb-2">$1</h3>',
  );
  processedHtml = processedHtml.replace(
    /^## (.+)$/gm,
    '<h2 class="text-xl font-bold text-ink mt-8 mb-3">$1</h2>',
  );
  processedHtml = processedHtml.replace(
    /^# (.+)$/gm,
    '<h1 class="text-2xl font-bold text-ink mt-8 mb-4">$1</h1>',
  );

  processedHtml = processedHtml.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-bold">$1</strong>',
  );
  processedHtml = processedHtml.replace(
    /\*(.+?)\*/g,
    '<em class="italic">$1</em>',
  );
  processedHtml = processedHtml.replace(
    /__(.+?)__/g,
    '<strong class="font-bold">$1</strong>',
  );
  processedHtml = processedHtml.replace(
    /_(.+?)_/g,
    '<em class="italic">$1</em>',
  );
  processedHtml = processedHtml.replace(
    /`([^`\n]+)`/g,
    '<code class="px-1.5 py-0.5 bg-frost rounded text-sm font-mono">$1</code>',
  );

  processedHtml = processedHtml.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="border-l-4 border-electric-iris pl-4 my-4 italic text-ink/70">$1</blockquote>',
  );
  processedHtml = processedHtml.replace(
    /^---$/gm,
    '<hr class="my-6 border-t-2 border-ink/20" />',
  );

  processedHtml = processedHtml.replace(
    /^[\-\*] (.+)$/gm,
    '<li class="ml-4 list-disc">$1</li>',
  );
  processedHtml = processedHtml.replace(
    /^\d+\. (.+)$/gm,
    '<li class="ml-4 list-decimal">$1</li>',
  );

  const listLines = processedHtml.split("\n");
  const groupedLines = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < listLines.length; i++) {
    const l = listLines[i];
    if (l.startsWith('<li class="ml-4 list-disc">')) {
      if (!inUl) {
        groupedLines.push('<ul class="my-4 space-y-1">');
        inUl = true;
      }
      if (inOl) {
        groupedLines.push("</ol>");
        inOl = false;
      }
      groupedLines.push(l);
    } else if (l.startsWith('<li class="ml-4 list-decimal">')) {
      if (!inOl) {
        groupedLines.push('<ol class="my-4 space-y-1">');
        inOl = true;
      }
      if (inUl) {
        groupedLines.push("</ul>");
        inUl = false;
      }
      groupedLines.push(l);
    } else {
      if (inUl) {
        groupedLines.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        groupedLines.push("</ol>");
        inOl = false;
      }
      groupedLines.push(l);
    }
  }
  if (inUl) groupedLines.push("</ul>");
  if (inOl) groupedLines.push("</ol>");
  processedHtml = groupedLines.join("\n");

  const tableRegex = /\|(.+)\|\n\|[\-\|]+\|\n((?:\|.+\|\n?)+)/g;
  processedHtml = processedHtml.replace(
    tableRegex,
    (match, headerRow, bodyRows) => {
      const headers = headerRow.split("|").filter((c) => c.trim());
      const rows = bodyRows
        .trim()
        .split("\n")
        .map((row) => row.split("|").filter((c) => c.trim()));

      let table =
        '<div class="overflow-x-auto my-4"><table class="w-full border-2 border-ink">';
      table += '<thead class="bg-frost"><tr>';
      headers.forEach((h) => {
        table += `<th class="border border-ink px-4 py-2 text-left font-bold">${h.trim()}</th>`;
      });
      table += "</tr></thead><tbody>";
      rows.forEach((row) => {
        table += "<tr>";
        row.forEach((cell) => {
          table += `<td class="border border-ink/30 px-4 py-2">${cell.trim()}</td>`;
        });
        table += "</tr>";
      });
      table += "</tbody></table></div>";
      return table;
    },
  );

  processedHtml = processedHtml
    .split("\n\n")
    .map((block) => {
      if (block.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr|div|table)/)) {
        return block;
      }
      if (block.trim()) {
        return `<p class="my-3 text-ink/80 leading-relaxed">${block.replace(/\n/g, "<br>")}</p>`;
      }
      return "";
    })
    .join("\n");

  return processedHtml;
}

export function renderMarkdownContent(markdown) {
  const { html, mermaidBlocks, chartBlocks } = parseMarkdownContent(markdown);
  const tokenRegex =
    /__MERMAID_PLACEHOLDER_(\d+)__|__CHART_PLACEHOLDER_(\d+)__/g;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(html))) {
    const before = html.slice(lastIndex, match.index);
    if (before.trim()) {
      nodes.push(
        <div
          key={`segment-${nodes.length}`}
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(before) }}
        />,
      );
    }

    const mermaidIndex = match[1];
    const chartIndex = match[2];

    if (mermaidIndex !== undefined) {
      nodes.push(
        <MermaidViewer
          key={`mermaid-${nodes.length}`}
          diagram={mermaidBlocks[Number(mermaidIndex)]}
        />,
      );
    }
    if (chartIndex !== undefined) {
      nodes.push(
        <RechartsViewer
          key={`chart-${nodes.length}`}
          chart={chartBlocks[Number(chartIndex)]}
        />,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = html.slice(lastIndex);
  if (tail.trim()) {
    nodes.push(
      <div
        key={`segment-${nodes.length}`}
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(tail) }}
      />,
    );
  }

  return nodes;
}
