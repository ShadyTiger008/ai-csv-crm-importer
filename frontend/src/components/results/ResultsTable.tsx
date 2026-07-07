import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { type CRMRecord, type SkippedRecord } from "~/types/crm";
import { Check, Mail, Phone, Calendar, Building2, MessageSquare, AlertCircle } from "lucide-react";

interface ResultsTableProps {
  imported: CRMRecord[];
  skipped: SkippedRecord[];
}

export default function ResultsTable({ imported, skipped }: ResultsTableProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">("imported");
  const [expandedReasons, setExpandedReasons] = useState<Record<number, boolean>>({});

  const toggleReason = (idx: number) => {
    setExpandedReasons((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Gracefully clean up the JSON error messages in skip reasons
  const getCleanReason = (reason: string) => {
    if (!reason) return { title: "Unknown Failure", details: null };
    
    const jsonStart = reason.indexOf("{");
    if (jsonStart !== -1) {
      try {
        const jsonStr = reason.substring(jsonStart);
        const parsed = JSON.parse(jsonStr);
        if (parsed?.error?.message) {
          return {
            title: "API Error: Quota or Rate Limit Exceeded",
            details: parsed.error.message,
          };
        }
      } catch (e) {
        // Fall back to original text formatting if parsing fails
      }
    }

    if (reason.startsWith("AI processing failed after retry:") || reason.startsWith("AI extraction failed after")) {
      return {
        title: "AI Service Extraction Failed",
        details: reason,
      };
    }

    return {
      title: reason,
      details: null,
    };
  };

  // Status-to-color mapping
  const getStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-slate-500 italic text-[11px]">None</span>;
    
    let classes = "bg-slate-800 border-slate-700 text-slate-400";
    let label = status.replace(/_/g, " ");

    switch (status) {
      case "GOOD_LEAD_FOLLOW_UP":
        classes = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
        label = "Follow Up";
        break;
      case "DID_NOT_CONNECT":
        classes = "bg-amber-500/10 border-amber-500/30 text-amber-400";
        label = "No Connection";
        break;
      case "BAD_LEAD":
        classes = "bg-rose-500/10 border-rose-500/30 text-rose-400";
        label = "Bad Lead";
        break;
      case "SALE_DONE":
        classes = "bg-indigo-500/10 border-indigo-500/30 text-indigo-400";
        label = "Sale Closed";
        break;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${classes} shrink-0`}>
        {label}
      </span>
    );
  };

  const getSourceBadge = (source: string | null) => {
    if (!source) return <span className="text-slate-500 italic text-[11px]">None</span>;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 border border-slate-700 text-slate-300 shrink-0">
        {source.replace(/_/g, " ")}
      </span>
    );
  };

  // Define Columns for the Imported Records Table (Desktop)
  const importedColumns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Lead Name",
      cell: (info: any) => {
        const name = info.getValue();
        return (
          <div className="font-semibold text-slate-200">
            {name || <span className="text-slate-500 italic">Unnamed Lead</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contact Info",
      cell: (info: any) => {
        const row = info.row.original as CRMRecord;
        return (
          <div className="space-y-1 text-xs">
            {row.email && (
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="truncate max-w-[180px]">{row.email}</span>
              </div>
            )}
            {row.mobile_without_country_code && (
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span>
                  {row.country_code ? `${row.country_code} ` : ""}
                  {row.mobile_without_country_code}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "company",
      header: "Company/Location",
      cell: (info: any) => {
        const row = info.row.original as CRMRecord;
        const locationParts = [row.city, row.state, row.country].filter(Boolean);
        const locationString = locationParts.join(", ");
        return (
          <div className="text-xs space-y-0.5">
            {row.company && (
              <div className="flex items-center space-x-1 text-slate-300 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{row.company}</span>
              </div>
            )}
            {locationString && (
              <div className="text-slate-500 pl-4.5 truncate max-w-[180px]">{locationString}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "crm_status",
      header: "CRM Status",
      cell: (info: any) => getStatusBadge(info.getValue()),
    },
    {
      accessorKey: "data_source",
      header: "Source",
      cell: (info: any) => getSourceBadge(info.getValue()),
    },
    {
      accessorKey: "crm_note",
      header: "Notes & Extracted Info",
      cell: (info: any) => {
        const note = info.getValue() as string | null;
        if (!note) return <span className="text-slate-600">-</span>;
        return (
          <div className="flex items-start space-x-1.5 max-w-xs text-xs text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2 hover:line-clamp-none transition-all duration-200 cursor-pointer">
              {note}
            </span>
          </div>
        );
      },
    },
  ], []);

  const importedTable = useReactTable({
    data: imported,
    columns: importedColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("imported")}
          className={`px-6 py-3 text-sm font-semibold tracking-wide border-b-2 transition duration-200 cursor-pointer ${
            activeTab === "imported"
              ? "border-violet-500 text-violet-400 bg-violet-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          Imported ({imported.length})
        </button>
        <button
          onClick={() => setActiveTab("skipped")}
          className={`px-6 py-3 text-sm font-semibold tracking-wide border-b-2 transition duration-200 cursor-pointer ${
            activeTab === "skipped"
              ? "border-rose-500 text-rose-400 bg-rose-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          Skipped ({skipped.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "imported" ? (
        imported.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            <p className="text-slate-400 text-sm">No leads were successfully imported.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-805">
                    {importedTable.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider border-r border-slate-850"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {importedTable.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/20 transition">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-5 py-3 text-sm border-r border-slate-850/40"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-4">
              {imported.map((row, idx) => {
                const locationParts = [row.city, row.state, row.country].filter(Boolean);
                const locationString = locationParts.join(", ");
                return (
                  <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-100 text-sm">
                        {row.name || <span className="text-slate-500 italic">Unnamed Lead</span>}
                      </div>
                      <div className="shrink-0">{getStatusBadge(row.crm_status)}</div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1.5 text-xs">
                      {row.email && (
                        <div className="flex items-center space-x-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span className="break-all">{row.email}</span>
                        </div>
                      )}
                      {row.mobile_without_country_code && (
                        <div className="flex items-center space-x-1.5 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span>
                            {row.country_code ? `${row.country_code} ` : ""}
                            {row.mobile_without_country_code}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Company & Location info */}
                    {(row.company || locationString) && (
                      <div className="border-t border-slate-900 pt-2.5 text-xs space-y-1">
                        {row.company && (
                          <div className="flex items-center space-x-1 text-slate-300 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{row.company}</span>
                          </div>
                        )}
                        {locationString && (
                          <div className="text-slate-500 pl-5">{locationString}</div>
                        )}
                      </div>
                    )}

                    {/* Source */}
                    {row.data_source && (
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-900">
                        <span className="text-slate-500 font-medium">Source:</span>
                        {getSourceBadge(row.data_source)}
                      </div>
                    )}

                    {/* Notes */}
                    {row.crm_note && (
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-400 flex items-start space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-3 hover:line-clamp-none cursor-pointer transition-all duration-200">
                          {row.crm_note}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : skipped.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <p className="text-slate-400 text-sm">Clean run! No rows were skipped.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {skipped.map((item, index) => {
            const { title, details } = getCleanReason(item.reason);
            return (
              <div
                key={index}
                className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-md space-y-4 text-slate-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start space-x-2.5 text-rose-300">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold leading-tight">{title}</span>
                    </div>
                    {details && (
                      <div className="pl-7">
                        <button
                          onClick={() => toggleReason(index)}
                          className="text-xs text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer transition focus:outline-none"
                        >
                          {expandedReasons[index] ? "Hide Technical Details" : "Show Technical Details"}
                        </button>
                        {expandedReasons[index] && (
                          <pre className="mt-2.5 p-3.5 bg-slate-950/80 border border-rose-950/40 rounded-xl text-xs text-rose-300/80 overflow-x-auto whitespace-pre-wrap break-all max-h-48 font-mono">
                            {details}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-slate-300 font-semibold shrink-0 whitespace-nowrap">
                    Row Index #{index + 1}
                  </span>
                </div>
                
                {/* Raw CSV Row Data Preview */}
                <div className="bg-slate-950 border border-slate-850/80 p-3.5 rounded-xl overflow-hidden text-[11px] font-mono text-slate-400">
                  <p className="text-slate-500 font-semibold mb-2 text-[10px] uppercase">Raw Row Values</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(item.row).map(([k, v]) => (
                      <div key={k} className="flex items-start space-x-1.5 p-2 bg-slate-900/40 rounded-lg border border-slate-800/50">
                        <span className="text-slate-500 shrink-0">{k}:</span>
                        <span className="text-slate-300 break-words">
                          {v !== null && v !== undefined && String(v).trim() !== "" ? (
                            String(v)
                          ) : (
                            <span className="italic text-slate-600">empty</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
