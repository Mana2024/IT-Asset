"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createAsset } from "@/app/actions/assets";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetTypeSelect } from "@/components/ui/AssetTypeSelect";

export default function NewAssetPage() {
  const [state, action, isPending] = useActionState(createAsset, undefined);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(d.departments ?? []));
  }, []);

  const err = (field: string) => state?.errors?.[field]?.[0];

  return (
    <div>
      <PageHeader title="Add New Asset" subtitle="Register a new IT asset" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        <form action={action} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Asset ID" name="asset_id" required placeholder="e.g. AST-2025-001" error={err("asset_id")} />
            <Input label="Serial Number (optional)" name="serial_number" placeholder="e.g. SN-ABC12345" error={err("serial_number")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AssetTypeSelect required error={err("asset_type")} />
            <Select
              label="Status"
              name="status"
              required
              options={[
                { value: "Available", label: "Available" },
                { value: "Assigned", label: "Assigned" },
                { value: "Maintenance", label: "Maintenance" },
              ]}
            />
          </div>
          <Select
            label="Department"
            name="department_id"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Select department (optional)"
          />
          <Textarea label="Description (optional)" name="description" placeholder="Any details about this asset..." />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" isPending={isPending}>Save Asset</Button>
            <Link href="/assets">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
