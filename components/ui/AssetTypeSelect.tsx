"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./Input";
import { ASSET_TYPES, ASSET_TYPE_CATEGORY, CATEGORY_LABELS } from "@/lib/types";

interface AssetTypeSelectProps {
  name?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
}

const CATEGORY_COLORS = {
  I:   "bg-purple-100 text-purple-700 border-purple-200",
  II:  "bg-blue-100 text-blue-700 border-blue-200",
  III: "bg-amber-100 text-amber-700 border-amber-200",
  IV:  "bg-teal-100 text-teal-700 border-teal-200",
};

const ALL_TYPES = [...ASSET_TYPES].filter((t) => t !== "Other").sort().concat("Other");

export function AssetTypeSelect({ name = "asset_type", defaultValue, error, required, onValueChange }: AssetTypeSelectProps) {
  const isCustom = !!defaultValue && !ASSET_TYPES.includes(defaultValue);
  const [selected, setSelected] = useState(isCustom ? "Other" : (defaultValue ?? ""));
  const [customValue, setCustomValue] = useState(isCustom ? (defaultValue ?? "") : "");
  const [query, setQuery] = useState(isCustom ? "Other" : (defaultValue ?? ""));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const finalValue = selected === "Other" ? customValue : selected;
  const category = ASSET_TYPE_CATEGORY[finalValue];

  useEffect(() => {
    onValueChange?.(finalValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected || "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  const filtered = query.trim()
    ? ALL_TYPES.filter((t) => t.toLowerCase().includes(query.trim().toLowerCase()))
    : ALL_TYPES;

  function selectType(t: string) {
    setSelected(t);
    setQuery(t);
    setOpen(false);
    if (t !== "Other") setCustomValue("");
  }

  function clearSelection() {
    setSelected("");
    setQuery("");
    setCustomValue("");
    setOpen(true);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={finalValue} />
      <div ref={containerRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Asset Type{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) setSelected(""); }}
            onFocus={(e) => { setOpen(true); e.target.select(); }}
            placeholder="Search asset type..."
            className={`w-full pl-9 pr-9 py-2 text-sm border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"}`}
          />
          {query && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No matching asset types</p>
            ) : (
              filtered.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectType(t)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                    selected === t ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {selected === "Other" && (
        <Input
          label="Specify Asset Type"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Enter the asset type name..."
          required={required}
          autoFocus
          error={error}
        />
      )}
      {category && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${CATEGORY_COLORS[category]}`}>
          <span className="font-bold">ICT {category}</span>
          <span>·</span>
          <span>{CATEGORY_LABELS[category]}</span>
        </div>
      )}
    </div>
  );
}
