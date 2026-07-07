import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import ErrorAlert from "../ui/ErrorAlert";

interface PreviewTableProps {
  headers: string[];
  parsedRows: Record<string, unknown>[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function PreviewTable({
  headers,
  parsedRows,
  onConfirm,
  onCancel,
  isLoading,
  error,
  onClearError,
}: PreviewTableProps) {
  // Generate columns dynamically based on parsed headers
  const columns = useMemo(() => {
    return headers.map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info: any) => {
        const val = info.getValue();
        if (val === null || val === undefined) return "";
        return String(val);
      },
    }));
  }, [headers]);

  // Display only the first 50 rows in the preview to preserve DOM speed
  const previewData = useMemo(() => {
    return parsedRows.slice(0, 50);
  }, [parsedRows]);

  const table = useReactTable({
    data: previewData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {error && (
        <ErrorAlert
          title="Import Failed"
          message={error}
          onClear={onClearError}
        />
      )}
      {/* Table Metadata Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">CSV Data Preview</h3>
            <p className="text-xs text-slate-400">
              Showing first {previewData.length} of {parsedRows.length} total rows. Confirm to run AI extraction.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl hover:bg-white/5 transition duration-200 disabled:opacity-50 text-sm font-semibold"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-violet-900/30 transition duration-200 disabled:opacity-50 text-sm font-semibold transform hover:scale-[1.01] active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Import</span>
          </button>
        </div>
      </div>

      {/* TanStack Scrollable Grid */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-900/30 transition duration-150"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-2.5 text-sm text-slate-400 border-r border-slate-800/40 whitespace-nowrap max-w-xs truncate"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
