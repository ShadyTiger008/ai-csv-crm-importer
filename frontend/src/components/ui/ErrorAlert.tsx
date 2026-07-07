import React, { useState } from "react";
import { AlertTriangle, Copy, Check, X, ChevronDown, ChevronUp, Info } from "lucide-react";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onClear?: () => void;
  className?: string;
}

export default function ErrorAlert({
  title = "An error occurred",
  message,
  onClear,
  className = "",
}: ErrorAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error message:", err);
    }
  };

  const isConnectionError =
    message.toLowerCase().includes("failed to connect") ||
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("connection");

  return (
    <div
      className={`w-full rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden ${className}`}
    >
      <div className="p-5 flex items-start gap-4">
        {/* Warning Icon Banner */}
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>

        {/* Error content */}
        <div className="flex-1 space-y-1 min-w-0">
          <h3 className="text-sm font-semibold text-rose-200 tracking-wide uppercase">
            {title}
          </h3>
          <p className="text-sm text-rose-300/90 leading-relaxed font-medium break-words">
            {message}
          </p>

          {/* Quick Troubleshooting Trigger */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition duration-150"
            >
              <span>{isExpanded ? "Hide Troubleshooting Guide" : "Show Troubleshooting Guide"}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <span className="text-slate-700 font-light text-xs">|</span>

            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition duration-150"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Error Details</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clear/Dismiss Action */}
        {onClear && (
          <button
            onClick={onClear}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 transition duration-200 shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded Troubleshooting Panel */}
      {isExpanded && (
        <div className="border-t border-rose-500/10 bg-rose-950/20 px-5 py-4 space-y-3.5 animate-in slide-in-from-top-2 duration-200 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold uppercase tracking-wider">
            <Info className="w-4 h-4 text-violet-400" />
            <span>Recommended Troubleshooting Steps</span>
          </div>

          {isConnectionError ? (
            <ul className="space-y-2.5 text-slate-400 list-decimal pl-4 leading-relaxed">
              <li>
                <strong className="text-slate-300">Verify Server Status:</strong> Check if the backend application is running. You can start it in your terminal with <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-violet-300 font-mono text-[10px]">npm run dev</code> or verify the host's service logs.
              </li>
              <li>
                <strong className="text-slate-300">Check Environment Base URL:</strong> Make sure the <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-violet-300 font-mono text-[10px]">NEXT_PUBLIC_API_URL</code> environment variable is set to the correct production or local API address in your frontend configuration files.
              </li>
              <li>
                <strong className="text-slate-300">CORS Policy Configuration:</strong> Ensure the backend server has the correct CORS headers enabled to allow cross-origin requests from this frontend URL.
              </li>
              <li>
                <strong className="text-slate-300">Direct Connection Test:</strong> Copy the target URL from the error details and try visiting it directly in your browser or Postman to see if the server responds.
              </li>
            </ul>
          ) : (
            <ul className="space-y-2.5 text-slate-400 list-decimal pl-4 leading-relaxed">
              <li>
                <strong className="text-slate-300">Verify CSV Formatting:</strong> Ensure the file is not corrupted and contains valid columns. The AI model needs headers and at least one row of records to function.
              </li>
              <li>
                <strong className="text-slate-300">Check Server Logs:</strong> Review the backend server console logs. Look for detailed stack traces or parser warnings that occurred at the time of submission.
              </li>
              <li>
                <strong className="text-slate-300">Retry Request:</strong> Try clearing the error, refreshing the file, and clicking "Confirm Import" again.
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
