import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useGeneration } from "../context/GenerationContext";
import { apiFetch, getAuthHeaders } from "../lib/api";
import { STATUS_MESSAGES } from "../lib/uploadOptions";
import StepIndicator from "../components/upload-wizard/StepIndicator";
import UploadStep from "../components/upload-wizard/UploadStep";
import ConfigureStep from "../components/upload-wizard/ConfigureStep";
import GeneratingStep from "../components/upload-wizard/GeneratingStep";
import DoneStep from "../components/upload-wizard/DoneStep";

function UploadPage() {
  const { user, refreshUser } = useAuth();
  const { startGeneration, retryJob, currentJob, getJobProgress } = useGeneration();
  const fileInputRef = useRef(null);

  // Wizard state
  const [step, setStep] = useState(1); // 1: upload, 2: configure, 3: generating, 4: done

  // Upload state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadData, setUploadData] = useState(null);

  // Configure state
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [depth, setDepth] = useState("standard");
  const [language, setLanguage] = useState("Same as PDF");
  const [persona, setPersona] = useState(null);
  const [selectedNotebookIds, setSelectedNotebookIds] = useState([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [includeDiagrams, setIncludeDiagrams] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [showNewNotebookInput, setShowNewNotebookInput] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [creatingNotebook, setCreatingNotebook] = useState(false);
  const [newNotebookError, setNewNotebookError] = useState(null);

  // Generating state
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);

  // Fetch notebooks on mount
  useEffect(() => {
    fetchNotebooks();
  }, []);

  // If a generation job is already running (or just finished/failed) when
  // this page mounts — e.g. the user started a generation, navigated to
  // another page, and came back — resume showing its real status instead
  // of resetting to a blank "step 1" wizard and losing track of it.
  useEffect(() => {
    if (!currentJob) return;
    if (currentJob.status === "running" || currentJob.status === "error") {
      setStep(3);
    } else if (currentJob.status === "done") {
      setStep(4);
    }
    // Intentionally mount-only: this resumes state on arrival, the effect
    // below keeps step in sync with currentJob for the rest of the visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch background job status and transition steps
  useEffect(() => {
    if (step === 3 && currentJob) {
      if (currentJob.status === "done") {
        setStep(4);
      }
    }
  }, [step, currentJob]);

  // Rotate status messages during generation
  useEffect(() => {
    if (step === 3 && currentJob?.status === "running") {
      const interval = setInterval(() => {
        setStatusMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, currentJob]);

  async function fetchNotebooks() {
    try {
      const response = await apiFetch("/api/notebooks");
      if (response.ok) {
        const data = await response.json();
        setNotebooks(data.notebooks || []);
      }
    } catch (err) {
      console.error("Failed to fetch notebooks:", err);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }

  function handleFileSelect(e) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }

  function validateAndSetFile(selectedFile) {
    setUploadError(null);

    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a PDF file");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setUploadError("File size must be under 20MB");
      return;
    }

    setFile(selectedFile);
  }

  function removeFile(e) {
    e.stopPropagation();
    setFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (selectedNotebookIds.length > 0) {
      formData.append("notebookId", selectedNotebookIds[0]);
    }

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        setUploadData(data.upload);
        setStep(2);
      } else {
        setUploadError(data.error || "Upload failed");
      }
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function toggleTemplate(templateKey) {
    setSelectedTemplates((prev) =>
      prev.includes(templateKey)
        ? prev.filter((t) => t !== templateKey)
        : [...prev, templateKey],
    );
  }

  function toggleNotebookSelection(nbId) {
    setSelectedNotebookIds((prev) =>
      prev.includes(nbId) ? prev.filter((id) => id !== nbId) : [...prev, nbId],
    );
  }

  async function createNotebookInline() {
    if (!newNotebookName.trim()) return;

    setCreatingNotebook(true);
    setNewNotebookError(null);
    try {
      const response = await apiFetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newNotebookName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotebooks((prev) => [...prev, data.notebook]);
        setSelectedNotebookIds((prev) => [...prev, data.notebook.id]);
        setNewNotebookName("");
        setShowNewNotebookInput(false);
      } else {
        const data = await response.json().catch(() => ({}));
        setNewNotebookError(data.error || "Failed to create notebook");
      }
    } catch (err) {
      setNewNotebookError("Failed to create notebook");
    } finally {
      setCreatingNotebook(false);
    }
  }

  const totalCreditsNeeded = selectedTemplates.length;
  const hasEnoughCredits =
    user?.credits >= totalCreditsNeeded || totalCreditsNeeded === 0;

  async function handleGenerate() {
    if (selectedTemplates.length === 0) return;
    if (!hasEnoughCredits) return;

    setStep(3);
    await startGeneration({
      pdfUploadId: uploadData.id,
      templates: selectedTemplates,
      depth,
      persona,
      language,
      customPrompt: customPrompt || undefined,
      notebookIds: selectedNotebookIds,
      includeDiagrams,
      includeCharts,
    });
  }

  function resetWizard() {
    setStep(1);
    setFile(null);
    setUploadData(null);
    setSelectedTemplates([]);
  }

  function handleRetry() {
    // Always retries from the job's own stored params (see
    // GenerationContext.retryJob) rather than local wizard state, so this
    // works correctly even if the user left this page and came back after
    // a failure and uploadData/selectedTemplates are no longer populated.
    if (currentJob?.id) {
      retryJob(currentJob.id);
    }
  }

  const currentProgress = currentJob ? getJobProgress(currentJob) : 0;
  const isJobError = currentJob?.status === "error";

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator step={step} />

      {step === 1 && (
        <UploadStep
          file={file}
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          fileInputRef={fileInputRef}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
          onRemoveFile={removeFile}
          onUpload={handleUpload}
        />
      )}

      {step === 2 && uploadData && (
        <ConfigureStep
          uploadData={uploadData}
          selectedTemplates={selectedTemplates}
          onToggleTemplate={toggleTemplate}
          includeDiagrams={includeDiagrams}
          onIncludeDiagramsChange={setIncludeDiagrams}
          includeCharts={includeCharts}
          onIncludeChartsChange={setIncludeCharts}
          depth={depth}
          onDepthChange={setDepth}
          language={language}
          onLanguageChange={setLanguage}
          persona={persona}
          onPersonaChange={setPersona}
          notebooks={notebooks}
          selectedNotebookIds={selectedNotebookIds}
          onToggleNotebookSelection={toggleNotebookSelection}
          showNewNotebookInput={showNewNotebookInput}
          onShowNewNotebookInputChange={setShowNewNotebookInput}
          newNotebookName={newNotebookName}
          onNewNotebookNameChange={setNewNotebookName}
          creatingNotebook={creatingNotebook}
          onCreateNotebookInline={createNotebookInline}
          newNotebookError={newNotebookError}
          onClearNewNotebookError={() => setNewNotebookError(null)}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
          totalCreditsNeeded={totalCreditsNeeded}
          userCredits={user?.credits}
          hasEnoughCredits={hasEnoughCredits}
          onGenerate={handleGenerate}
        />
      )}

      {step === 3 && (
        <GeneratingStep
          isJobError={isJobError}
          currentJob={currentJob}
          statusMessageIndex={statusMessageIndex}
          templateCount={currentJob?.totalCount ?? selectedTemplates.length}
          currentProgress={currentProgress}
          onBackToOptions={uploadData ? () => setStep(2) : null}
          onStartOver={resetWizard}
          onRetry={handleRetry}
        />
      )}

      {step === 4 && (
        <DoneStep currentJob={currentJob} onUploadAnother={resetWizard} />
      )}
    </div>
  );
}

export default UploadPage;
