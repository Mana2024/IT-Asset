"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { updateAsset } from "@/app/actions/assets";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetTypeSelect } from "@/components/ui/AssetTypeSelect";

export default function EditAssetPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [asset, setAsset] = useState<any>(null);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  const boundUpdateAsset = updateAsset.bind(null, parseInt(id));
  const [state, action, isPending] = useActionState(boundUpdateAsset, undefined);

  useEffect(() => {
    fetch(`/api/assets/${id}`).then((r) => r.json()).then((d) => setAsset(d.asset));
    fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(d.departments ?? []));
  }, [id]);

  if (!asset) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const err = (field: string) => state?.errors?.[field]?.[0];

  return (
    <div>
      <PageHeader title="Edit Asset" subtitle={asset.asset_id} />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        <form action={action} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Asset ID" name="asset_id" required defaultValue={asset.asset_id} error={err("asset_id")} />
            <Input label="Serial Number (optional)" name="serial_number" defaultValue={asset.serial_number ?? ""} error={err("serial_number")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AssetTypeSelect required defaultValue={asset.asset_type} error={err("asset_type")} />
            <Select
              label="Status"
              name="status"
              required
              options={[
                { value: "Available", label: "Available" },
                { value: "Assigned", label: "Assigned" },
                { value: "Maintenance", label: "Maintenance" },
              ]}
              defaultValue={asset.status}
            />
          </div>
          <Select
            label="Department"
            name="department_id"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Select department (optional)"
            defaultValue={asset.department_id ?? ""}
          />
          <Textarea label="Description (optional)" name="description" defaultValue={asset.description ?? ""} />
          <div className="flex items-center gap-3">
            <Button type="submit" isPending={isPending}>Save Changes</Button>
            <Link href={`/assets/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          </div>
        </form>
      </div>
    </div>
  );
}
