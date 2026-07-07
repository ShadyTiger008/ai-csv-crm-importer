import React from "react";
import { Users, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

interface StatsBarProps {
  importedCount: number;
  skippedCount: number;
  onReset: () => void;
}

export default function StatsBar({ importedCount, skippedCount, onReset }: StatsBarProps) {
  const total = importedCount + skippedCount;
  const successRate = total > 0 ? Math.round((importedCount / total) * 100) : 0;

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Import Complete</h2>
          <p className="text-xs text-slate-400">
            AI has finished mapping, cleaning, and extracting your CSV data.
          </p>
        </div>
        
        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl transition duration-200 text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Another File</span>
        </button>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Success Card */}
        <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm shadow-xl flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leads Imported</p>
            <h3 className="text-3xl font-extrabold text-emerald-300 mt-1">{importedCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Successfully formatted & stored</p>
          </div>
        </div>

        {/* Skipped Card */}
        <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-sm shadow-xl flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rows Skipped</p>
            <h3 className="text-3xl font-extrabold text-rose-300 mt-1">{skippedCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Missing contact details or error</p>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="p-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm shadow-xl flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Success Rate</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-3xl font-extrabold text-violet-300">{successRate}%</h3>
              <span className="text-xs text-slate-400">({importedCount}/{total})</span>
            </div>
            {/* Tiny progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-700/50">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
