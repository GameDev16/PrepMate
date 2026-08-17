import React from "react";
import { FileText, Check } from "lucide-react";
import {
  TEMPLATE_CONFIGS,
  DEPTH_CONFIGS,
  PERSONA_CONFIGS,
  SUPPORTED_LANGUAGES,
} from "../../lib/uploadOptions";
import { templateAccent } from "../../lib/templateMeta";

function ConfigureStep({
  uploadData,
  selectedTemplates,
  onToggleTemplate,
  includeDiagrams,
  onIncludeDiagramsChange,
  includeCharts,
  onIncludeChartsChange,
  depth,
  onDepthChange,
  language,
  onLanguageChange,
  persona,
  onPersonaChange,
  notebooks,
  selectedNotebookIds,
  onToggleNotebookSelection,
  showNewNotebookInput,
  onShowNewNotebookInputChange,
  newNotebookName,
  onNewNotebookNameChange,
  creatingNotebook,
  onCreateNotebookInline,
  newNotebookError,
  onClearNewNotebookError,
  customPrompt,
  onCustomPromptChange,
  totalCreditsNeeded,
  userCredits,
  hasEnoughCredits,
  onGenerate,
}) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* File info */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <div className="flex items-center gap-4">
          <FileText size={32} strokeWidth={1.5} className="text-electric-iris shrink-0" />
          <div>
            <p className="font-bold text-ink">{uploadData.fileName}</p>
            <p className="text-sm text-ink/60">
              {uploadData.pageCount} pages ·{" "}
              {(uploadData.fileSize / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      </div>

      {/* Template selection */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <h2 className="font-display font-normal text-2xl text-ink tracking-tight mb-4">
          Choose Templates
        </h2>
        <p className="text-ink/60 mb-6">Select one or more study formats</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => {
            const selected = selectedTemplates.includes(key);
            return (
              <button
                key={key}
                onClick={() => onToggleTemplate(key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? "border-electric-iris bg-electric-iris/5 shadow-hard-iris-sm"
                    : "border-ink/20 hover:border-ink/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${templateAccent(key)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink">{config.label}</p>
                    <p className="text-xs text-ink/60 mt-1 line-clamp-2">
                      {config.description}
                    </p>
                  </div>
                  {selected && (
                    <span className="text-electric-iris shrink-0">
                      <Check size={20} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Visuals: Diagrams & Charts */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <h2 className="font-display font-normal text-2xl text-ink tracking-tight mb-2">
          Visual Enhancements (Optional)
        </h2>
        <p className="text-ink/60 mb-4 text-sm">
          Add AI-generated structured diagrams and data charts to any
          template
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <label
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              includeDiagrams
                ? "border-electric-iris bg-electric-iris/5 shadow-hard-iris-sm"
                : "border-ink/20 hover:border-ink/40"
            }`}
          >
            <input
              type="checkbox"
              checked={includeDiagrams}
              onChange={(e) => onIncludeDiagramsChange(e.target.checked)}
              className="w-5 h-5 accent-electric-iris rounded cursor-pointer"
            />
            <div>
              <div className="font-bold text-ink">Include Diagrams</div>
              <div className="text-xs text-ink/60">
                Mermaid.js concept architecture & flowcharts
              </div>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              includeCharts
                ? "border-electric-iris bg-electric-iris/5 shadow-hard-iris-sm"
                : "border-ink/20 hover:border-ink/40"
            }`}
          >
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => onIncludeChartsChange(e.target.checked)}
              className="w-5 h-5 accent-electric-iris rounded cursor-pointer"
            />
            <div>
              <div className="font-bold text-ink">Include Charts</div>
              <div className="text-xs text-ink/60">
                Recharts quantitative data visualizations
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Depth selection */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <h2 className="font-display font-normal text-2xl text-ink tracking-tight mb-4">
          Depth Level
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DEPTH_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => onDepthChange(key)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                depth === key
                  ? "border-electric-iris bg-electric-iris text-white"
                  : "border-ink/20 hover:border-ink/40 text-ink"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language selection */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <h2 className="font-display font-normal text-2xl text-ink tracking-tight mb-4">
          Output Language
        </h2>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-ink rounded-xl focus:border-electric-iris focus:outline-none"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Persona selection */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <h2 className="font-display font-normal text-2xl text-ink tracking-tight mb-4">
          AI Persona
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onPersonaChange(null)}
            className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
              persona === null
                ? "border-electric-iris bg-electric-iris text-white"
                : "border-ink/20 hover:border-ink/40 text-ink"
            }`}
          >
            Default
          </button>
          {Object.entries(PERSONA_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => onPersonaChange(key)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                persona === key
                  ? "border-electric-iris bg-electric-iris text-white"
                  : "border-ink/20 hover:border-ink/40 text-ink"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Notebook selection */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="font-display font-normal text-2xl text-ink tracking-tight">
            Save to Notebooks (Optional)
          </h2>
          <button
            type="button"
            onClick={() => {
              onShowNewNotebookInputChange(!showNewNotebookInput);
              onClearNewNotebookError();
            }}
            className="shrink-0 px-4 py-2 rounded-full border-2 border-ink/20 hover:border-electric-iris hover:text-electric-iris font-medium text-sm transition-all"
          >
            + New Notebook
          </button>
        </div>
        <p className="text-ink/60 mb-4 text-sm">
          Select one or more notebooks where these notes will appear
        </p>

        {showNewNotebookInput && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={newNotebookName}
              onChange={(e) => onNewNotebookNameChange(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (e.preventDefault(), onCreateNotebookInline())
              }
              placeholder="Notebook name"
              autoFocus
              className="flex-1 px-4 py-2.5 bg-chalk border border-frost rounded-full focus:outline-none focus:ring-2 focus:ring-electric-iris text-ink text-sm"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={onCreateNotebookInline}
                disabled={creatingNotebook || !newNotebookName.trim()}
                className="px-4 py-2.5 bg-electric-iris text-white rounded-full font-medium text-sm shadow-hard-sm hover:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {creatingNotebook ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onShowNewNotebookInputChange(false);
                  onNewNotebookNameChange("");
                  onClearNewNotebookError();
                }}
                className="px-4 py-2.5 border-2 border-ink/20 rounded-full font-medium text-sm hover:border-ink/40 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {newNotebookError && (
          <p className="text-marker-red text-sm mb-4">{newNotebookError}</p>
        )}

        {notebooks.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
            {notebooks.map((nb) => {
              const isChecked = selectedNotebookIds.includes(nb.id);
              return (
                <label
                  key={nb.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isChecked
                      ? "border-electric-iris bg-electric-iris/5 font-bold"
                      : "border-ink/20 hover:border-ink/40 font-medium"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleNotebookSelection(nb.id)}
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
        ) : (
          !showNewNotebookInput && (
            <p className="text-ink/50 text-sm italic">
              You don't have any notebooks yet — create one above.
            </p>
          )
        )}
      </div>

      {/* Custom prompt */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard">
        <h2 className="font-display font-normal text-2xl text-ink tracking-tight mb-4">
          Custom Instructions (Optional)
        </h2>
        <textarea
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="Add any specific instructions for the AI..."
          rows={3}
          className="w-full px-4 py-3 border-2 border-ink rounded-xl focus:border-electric-iris focus:outline-none resize-none"
        />
      </div>

      {/* Generate footer */}
      <div className="bg-paper border border-frost card-rounded p-6 shadow-hard flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="font-medium text-ink">
            {selectedTemplates.length} template
            {selectedTemplates.length !== 1 ? "s" : ""} selected
          </p>
          <p className="text-sm text-ink/60">
            Cost: {totalCreditsNeeded} credit
            {totalCreditsNeeded !== 1 ? "s" : ""} · You have{" "}
            {userCredits || 0} credits
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={selectedTemplates.length === 0 || !hasEnoughCredits}
          className="px-8 py-3 bg-electric-iris text-white font-bold btn-pill shadow-hard hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Notes
        </button>
      </div>

      {!hasEnoughCredits && selectedTemplates.length > 0 && (
        <p className="text-center text-marker-red font-bold">
          Not enough credits. You need {totalCreditsNeeded} but have{" "}
          {userCredits || 0}. Click "+ Buy Credits" in the sidebar to top up!
        </p>
      )}
    </div>
  );
}

export default ConfigureStep;
