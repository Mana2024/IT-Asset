"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { upsertEolPolicy } from "@/app/actions/eolPolicies";
import { ASSET_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export default function EolPoliciesPage() {
  const [state, action, isPending] = useActionState(upsertEolPolicy, undefined);
  const [policies, setPolicies] = useState<any[]>([]);
  const [assetType, setAssetType] = useState(ASSET_TYPES[0] ?? "");
  const [lifespan, setLifespan] = useState(3);

  useEffect(() => {
    fetch("/api/eol-policies").then((r) => r.json()).then((d) => setPolicies(d.policies ?? []));
  }, [state]);

  const remove = async (id: number) => {
    await fetch("/api/eol-policies", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const res = await fetch("/api/eol-policies");
    const d = await res.json();
    setPolicies(d.policies ?? []);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">End-of-Life Policies</h2>

      <form action={action} className="flex items-end gap-3 mb-4">
        <Select label="Asset Type" name="asset_type" value={assetType} onChange={(e) => setAssetType(e.target.value)} options={ASSET_TYPES.map((t) => ({ value: t, label: t }))} />
        <Input label="Lifespan (years)" name="lifespan_years" type="number" value={String(lifespan)} onChange={(e) => setLifespan(Number(e.target.value))} />
        <Button type="submit" isPending={isPending}>Save</Button>
      </form>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left">Asset Type</th>
            <th className="text-left">Lifespan (years)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {policies.map((p) => (
            <tr key={p.id}>
              <td>{p.asset_type}</td>
              <td>{p.lifespan_years}</td>
              <td><button className="text-sm text-red-600" onClick={() => remove(p.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
