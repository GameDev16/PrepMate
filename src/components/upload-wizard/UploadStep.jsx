import React from "react";
import { X, FileText, UploadCloud } from "lucide-react";

function UploadStep({
  file,
  uploading,
  uploadProgress,
  uploadError,
  fileInputRef,
  onDrop,
  onFileSelect,
  onRemoveFile,
  onUpload,
}) {
  return (
    <div className="bg-paper border border-frost card-rounded p-8 shadow-hard animate-fade-in-up">
      <h1 className="font-display font-normal text-[28px] text-ink tracking-tight text-center mb-2">
        Upload your PDF
      </h1>
      <p className="text-ink/60 text-center mb-8">
        Drop a PDF file or click to browse
      </p>

      {uploadError && (
        <div className="mb-6 p-4 bg-marker-red/10 border-2 border-marker-red rounded-xl text-marker-red text-sm text-center font-medium">
          {uploadError}
        </div>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
          file
            ? "border-jelly-green bg-jelly-green/5"
            : "border-ink/30 hover:border-electric-iris hover:bg-frost/50"
        }`}
      >
        {file && (
          <button
            type="button"
            onClick={onRemoveFile}
            title="Remove file"
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-paper border-2 border-ink/20 text-ink/60 hover:border-marker-red hover:text-marker-red transition-all"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={onFileSelect}
          className="hidden"
        />
        {file ? (
          <div>
            <FileText size={44} strokeWidth={1.5} className="mx-auto mb-4 text-jelly-green" />
            <p className="font-medium text-ink">{file.name}</p>
            <p className="text-sm text-ink/60">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <UploadCloud size={44} strokeWidth={1.5} className="mx-auto mb-4 text-ink/40" />
            <p className="font-medium text-ink">Drop your PDF here</p>
            <p className="text-sm text-ink/60 mt-1">
              or click to browse (max 20MB)
            </p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-6">
          <div className="h-2 bg-frost rounded-full overflow-hidden">
            <div
              className="h-full bg-electric-iris transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-ink/60 text-center mt-2">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {file && !uploading && (
        <button
          onClick={onUpload}
          className="w-full mt-6 py-3 bg-electric-iris text-white font-bold btn-pill shadow-hard hover:translate-y-1 hover:shadow-none transition-all"
        >
          Upload & Continue
        </button>
      )}
    </div>
  );
}

export default UploadStep;
