import React, { useRef, useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function UploadZone({ onFileSelect, isLoading, error }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative flex flex-col items-center justify-center w-full h-80 px-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/5 shadow-xl ${
          isDragActive
            ? "border-violet-500 bg-violet-500/10 scale-[1.02]"
            : "border-slate-700 hover:border-violet-500/50 hover:bg-white/10"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-slate-800/80 border border-slate-700 text-violet-400 shadow-md">
            {isLoading ? (
              <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-10 h-10 animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-100">
              {isLoading ? "Reading CSV..." : "Drag and drop your CSV here"}
            </p>
            <p className="text-sm text-slate-400">
              Or click to browse files from your computer
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs bg-slate-900/60 border border-slate-800 text-slate-300 py-1.5 px-3 rounded-full">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accepts CSV files with any header alignment</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-start space-x-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">
            <p className="font-semibold text-rose-200">Upload failed</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Helpful instructions panel */}
      <div className="mt-10 p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">How to format your CSV</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Our system is powered by AI, meaning you do not need to rename headers to fit our database schema. Upload any sheet (e.g. Facebook leads, Google Ads exports, or customized spreadsheets). 
          The model dynamically maps your headers (like <code className="text-violet-400">Ph</code>, <code className="text-violet-400">Mobile No.</code>, <code className="text-violet-400">Cell</code>) to our strict CRM fields.
        </p>
        <div className="text-xs text-slate-400 pt-1">
          <span className="font-semibold text-slate-300">Skip Rule:</span> Leads with neither an email address nor a phone number will be automatically cataloged as skipped.
        </div>
      </div>
    </div>
  );
}
