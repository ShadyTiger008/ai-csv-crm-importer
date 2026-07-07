"use client";

import React, { useEffect, useState } from "react";
import { useCsvImport } from "~/hooks/useCsvImport";
import UploadZone from "~/components/upload/UploadZone";
import PreviewTable from "~/components/preview/PreviewTable";
import StatsBar from "~/components/results/StatsBar";
import ResultsTable from "~/components/results/ResultsTable";
import { Sparkles, Brain, Loader2 } from "lucide-react";

const LOADING_STATUSES = [
  "Reading CSV file headers...",
  "Splitting rows into concurrent batches of 15...",
  "Analyzing data columns with Gemini 2.0 Flash...",
  "Enforcing strict CRM status & source enums...",
  "Resolving multiple phone numbers & emails...",
  "Converting and normalising created_at dates...",
  "Wrapping up results into structured CRM leads...",
];

export default function Home() {
  const {
    step,
    fileName,
    parsedRows,
    headers,
    results,
    isLoading,
    error,
    onFileSelect,
    onConfirmImport,
    onReset,
  } = useCsvImport();

  const [loadingStatusIdx, setLoadingStatusIdx] = useState(0);

  // Rotate through loading status messages to keep the user engaged
  useEffect(() => {
    if (step !== "IMPORTING") {
      setLoadingStatusIdx(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStatusIdx((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [step]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col relative overflow-hidden select-none">
      {/* Decorative Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Navbar */}
      <header className="border-b border-slate-900 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-100 tracking-tight text-lg">AI CSV Importer</span>
              <span className="ml-2 text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono">v1.0</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Gemini-powered Mapper</span>
          </div>
        </div>
      </header>

      {/* Page Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {step === "UPLOAD" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Import any CSV to your CRM
              </h1>
              <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Drop in leads lists from any source. Our LLM parses headers, maps values, filters blanks, and returns structured CRM data instantly.
              </p>
            </div>

            <UploadZone
              onFileSelect={onFileSelect}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}

        {step === "PREVIEW" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-100">Review Spreadsheet Layout</h2>
              <p className="text-sm text-slate-400">
                Verify the contents of <span className="font-semibold text-slate-300">{fileName}</span> before committing.
              </p>
            </div>

            <PreviewTable
              headers={headers}
              parsedRows={parsedRows}
              onConfirm={onConfirmImport}
              onCancel={onReset}
              isLoading={isLoading}
            />
          </div>
        )}

        {step === "IMPORTING" && (
          <div className="flex flex-col items-center justify-center space-y-6 py-20 text-center animate-fade-in max-w-md mx-auto">
            <div className="relative">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
              
              <div className="relative p-6 rounded-full bg-slate-900 border border-slate-800 shadow-2xl text-violet-400 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">Extracting CRM Records</h3>
              <div className="h-6 overflow-hidden relative">
                <p className="text-sm text-slate-400 animate-slide-up">
                  {LOADING_STATUSES[loadingStatusIdx]}
                </p>
              </div>
            </div>

            {/* Simulated progress indicator bar */}
            <div className="w-64 bg-slate-950 border border-slate-900 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full w-[80%] rounded-full animate-pulse-progress" />
            </div>
          </div>
        )}

        {step === "RESULTS" && results && (
          <div className="space-y-8 animate-fade-in">
            <StatsBar
              importedCount={results.total_imported}
              skippedCount={results.total_skipped}
              onReset={onReset}
            />

            <ResultsTable
              imported={results.imported}
              skipped={results.skipped}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950/60 py-6 text-center text-xs text-slate-500 bg-slate-950/20">
        <p>&copy; {new Date().getFullYear()} AI CSV to CRM Importer. Built with Next.js & Gemini 2.0.</p>
      </footer>
    </div>
  );
}
