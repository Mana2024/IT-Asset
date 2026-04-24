"use client";

import { useState } from "react";
import { Select, Input } from "./Input";
import { ASSET_TYPES } from "@/lib/types";

interface AssetTypeSelectProps {
  name?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}

export function AssetTypeSelect({ name = "asset_type", defaultValue, error, required }: AssetTypeSelectProps) {
  const isCustom = !!defaultValue && !ASSET_TYPES.includes(defaultValue);
  const [selected, setSelected] = useState(isCustom ? "Other" : (defaultValue ?? ""));
  const [customValue, setCustomValue] = useState(isCustom ? (defaultValue ?? "") : "");

  const finalValue = selected === "Other" ? customValue : selected;

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={finalValue} />
      <Select
        label="Asset Type"
        required={required}
        value={selected}
        onChange={(e) => { setSelected(e.target.value); if (e.target.value !== "Other") setCustomValue(""); }}
        options={ASSET_TYPES.map((t) => ({ value: t, label: t }))}
        placeholder="Select asset type..."
        error={selected !== "Other" ? error : undefined}
      />
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
    </div>
  );
}
