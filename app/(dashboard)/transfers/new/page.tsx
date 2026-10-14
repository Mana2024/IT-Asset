"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createTransfer } from "@/app/actions/transfers";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Search, X } from "lucide-react";

export default function NewTransferPage() {
  const [state, action, isPending] = useActionState(createTransfer, undefined);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(d.departments ?? []));
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/assets?q=${encodeURIComponent(query)}&limit=30`)
        .then((r) => r.json())
        .then((d) => setResults(d.assets ?? []));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const err = (field: string) => state?.errors?.[field]?.[0];

  return (
    <div>
      <PageHeader title="Request Transfer" subtitle="Move an asset to a different department" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        {state?.message && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.message}</div>
        )}

        <form action={action} className="space-y-5">
          {/* Asset selection */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Asset to Transfer <span className="text-red-500">*</span>
            </label>
            {!selected ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by asset ID or type..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {results.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {results.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setSelected(a); setQuery(""); setResults([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0"
                      >
                        <span className="font-mono font-medium text-blue-700">{a.asset_id}</span>
                        <span className="text-gray-600 ml-2">{a.asset_type}</span>
                        {a.department_name && <span className="text-gray-400 ml-2 text-xs">· {a.department_name}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-mono font-medium text-blue-700">{selected.asset_id}</span>
                  <span className="text-gray-600 ml-2">{selected.asset_type}</span>
                  {selected.department_name && (
                    <span className="text-gray-400 ml-2 text-xs">
                      · Currently: {selected.department_name}, Room {selected.room_number ?? "—"}
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => setSelected(null)} className="text-blue-400 hover:text-blue-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {selected && <input type="hidden" name="asset_id" value={selected.id} />}
            {err("asset_id") && <p className="text-xs text-red-600">{err("asset_id")}</p>}
          </div>

          {/* Target department + room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Transfer To <span className="text-red-500">*</span>
              </label>
              <select
                name="target_dept_id"
                required
                className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${err("target_dept_id") ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"}`}
              >
                <option value="">Select target department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {err("target_dept_id") && <p className="text-xs text-red-600">{err("target_dept_id")}</p>}
            </div>

            <Input
              label="To Room No."
              name="target_room_number"
              required
              placeholder="e.g. Room 204"
              error={err("target_room_number")}
            />
          </div>

          {/* Reason */}
          <Textarea
            label="Reason / Justification"
            name="reason"
            required
            placeholder="Why is this asset being transferred?"
            rows={3}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" isPending={isPending}>Submit Transfer Request</Button>
            <Link href="/transfers"><Button type="button" variant="outline">Cancel</Button></Link>
          </div>
        </form>
      </div>
    </div>
  );
}
