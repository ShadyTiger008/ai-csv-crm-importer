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

  // Status-to-color mapping
  const getStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-slate-500 italic">None</span>;
    
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
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${classes}`}>
        {label}
      </span>
    );
  };

  const getSourceBadge = (source: string | null) => {
    if (!source) return <span className="text-slate-500 italic">None</span>;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-300">
        {source.replace(/_/g, " ")}
      </span>
    );
  };

  // Define Columns for the Imported Records Table
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
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-850">
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
        )
      ) : skipped.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <p className="text-slate-400 text-sm">Clean run! No rows were skipped.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {skipped.map((item, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-md space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-2.5 text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-semibold">Skip Reason: {item.reason}</span>
                </div>
                <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-400">
                  Row Index #{index + 1}
                </span>
              </div>
              
              {/* Raw CSV Row Data Preview */}
              <div className="bg-slate-950 border border-slate-850/80 p-3.5 rounded-xl overflow-x-auto text-[11px] font-mono text-slate-400">
                <p className="text-slate-500 font-semibold mb-1 text-[10px] uppercase">Raw Row Values</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {Object.entries(item.row).map(([k, v]) => (
                    <div key={k} className="flex items-center space-x-1 border-r border-slate-850 pr-4 last:border-r-0">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-slate-300">{v !== null && v !== undefined && String(v).trim() !== "" ? String(v) : <span className="italic text-slate-600">empty</span>}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
