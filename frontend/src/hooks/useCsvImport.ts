import { useState, useCallback } from "react";
import { parseCsvClientSide } from "~/lib/csv";
import { sendCsvRowsToBackend } from "~/lib/api";
import { type ImportResponse } from "~/types/crm";

export type ImportStep = "UPLOAD" | "PREVIEW" | "IMPORTING" | "RESULTS";

export interface UseCsvImportResult {
  step: ImportStep;
  fileName: string | null;
  parsedRows: Record<string, unknown>[];
  headers: string[];
  results: ImportResponse | null;
  isLoading: boolean;
  error: string | null;
  onFileSelect: (file: File) => Promise<void>;
  onConfirmImport: () => Promise<void>;
  onReset: () => void;
  clearError: () => void;
}

export function useCsvImport(): UseCsvImportResult {
  const [step, setStep] = useState<ImportStep>("UPLOAD");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [results, setResults] = useState<ImportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onFileSelect = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);
    setFileName(file.name);

    try {
      if (!file.name.endsWith(".csv")) {
        throw new Error("Invalid file type. Please upload a .csv file.");
      }

      const parsed = await parseCsvClientSide(file);

      if (parsed.data.length === 0) {
        throw new Error("The uploaded CSV file is empty or has no valid rows.");
      }

      setParsedRows(parsed.data);
      setHeaders(parsed.meta.fields || []);
      setStep("PREVIEW");
    } catch (err: unknown) {
      console.error("Error parsing CSV on client:", err);
      const msg = err instanceof Error ? err.message : "Failed to parse CSV file.";
      setError(msg);
      setStep("UPLOAD");
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onConfirmImport = useCallback(async () => {
    if (parsedRows.length === 0) return;

    setError(null);
    setIsLoading(true);
    setStep("IMPORTING");

    try {
      const response = await sendCsvRowsToBackend(parsedRows);
      setResults(response);
      setStep("RESULTS");
    } catch (err: unknown) {
      console.error("Error during backend import confirm:", err);
      const msg = err instanceof Error ? err.message : "Backend connection or processing failure.";
      setError(msg);
      setStep("PREVIEW");
    } finally {
      setIsLoading(false);
    }
  }, [parsedRows]);

  const onReset = useCallback(() => {
    setStep("UPLOAD");
    setFileName(null);
    setParsedRows([]);
    setHeaders([]);
    setResults(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
    clearError,
  };
}
