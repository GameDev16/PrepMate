import React, { useState, useEffect } from "react";
import { Workflow } from "lucide-react";

function MermaidViewer({ diagram }) {
  const [svgHtml, setSvgHtml] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!diagram) return;
    let mounted = true;
    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        // Non-negotiable security requirement: strict mode
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "default",
          // Without this, a syntax error doesn't reject -- mermaid resolves
          // successfully but injects its own "Syntax error in text" bomb-icon
          // SVG into svgHtml instead. This makes render() throw properly so
          // our own catch block below shows the raw-diagram fallback instead.
          suppressErrorRendering: true,
        });
        const id = "mermaid_" + Math.random().toString(36).substring(2, 9);
        const { svg } = await mermaid.render(id, diagram.trim());
        if (mounted) setSvgHtml(svg);
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (mounted) setError("Could not render diagram visually.");
      }
    }
    renderMermaid();
    return () => {
      mounted = false;
    };
  }, [diagram]);

  return (
    <div className="my-6 p-6 bg-chalk border-2 border-ink rounded-2xl shadow-hard overflow-x-auto">
      <h4 className="font-display font-bold text-ink mb-4 flex items-center gap-2 text-lg">
        <Workflow size={20} strokeWidth={2} className="text-electric-iris shrink-0" />
        Concept Architecture Diagram
      </h4>
      {svgHtml ? (
        <div
          className="flex justify-center my-4"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : error ? (
        <div>
          <p className="text-sm text-ink/60 mb-2">
            This diagram couldn't be rendered visually — showing its raw source
            instead:
          </p>
          <pre className="bg-ink text-white p-4 rounded-xl font-mono text-sm overflow-x-auto">
            {diagram}
          </pre>
        </div>
      ) : (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-electric-iris border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

export default MermaidViewer;
