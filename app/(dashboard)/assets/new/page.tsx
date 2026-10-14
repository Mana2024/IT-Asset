"use client";

import { useActionState } from "react";
import { useState } from "react";
import Link from "next/link";
import { createAsset } from "@/app/actions/assets";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetTypeSelect } from "@/components/ui/AssetTypeSelect";
import { ASSET_TYPE_CODE } from "@/lib/types";

export default function NewAssetPage() {
  const [state, action, isPending] = useActionState(createAsset, undefined);
  const [quantity, setQuantity] = useState(1);
  const [assetType, setAssetType] = useState("");

  const err = (field: string) => state?.errors?.[field]?.[0];
  const year = new Date().getFullYear();
  const typeCode = assetType ? (ASSET_TYPE_CODE[assetType] ?? assetType.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X")) : null;

  return (
    <div>
      <PageHeader title="Add New Asset" subtitle="Register a new IT asset" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        <form action={action} className="space-y-5">

          <AssetTypeSelect required error={err("asset_type")} onValueChange={setAssetType} />
          <p className="text-xs text-gray-500 -mt-3">
            New assets are always added with status <span className="font-medium text-gray-700">Available</span>. Change status later from the asset's edit page once it's issued or sent for maintenance.
          </p>

          {/* Quantity */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-semibold text-blue-800 mb-1">
              Number of Assets to Add
            </label>
            <p className="text-xs text-blue-600 mb-3">
              Serial numbers are added later when each asset is assigned.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border-2 border-blue-300 text-blue-700 font-bold hover:bg-blue-100 flex items-center justify-center"
              >−</button>
              <span className="text-2xl font-bold text-blue-900 w-10 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full border-2 border-blue-300 text-blue-700 font-bold hover:bg-blue-100 flex items-center justify-center"
              >+</button>
              <input type="hidden" name="quantity" value={quantity} />
            </div>
          </div>

          {/* Asset ID preview — always auto-generated as {CODE}-{YEAR}-{seq} */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-1">Asset ID (auto-generated)</p>
            {typeCode ? (
              <p className="font-mono text-sm text-gray-900">
                {quantity > 1
                  ? <>{typeCode}-{year}-<span className="text-gray-400">NNN</span> through {typeCode}-{year}-<span className="text-gray-400">NNN</span> ({quantity} assets)</>
                  : <>{typeCode}-{year}-<span className="text-gray-400">NNN</span></>}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Select an asset type above to preview the ID format</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" isPending={isPending}>
              {quantity > 1 ? `Add ${quantity} Assets` : "Save Asset"}
            </Button>
            <Link href="/assets">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
