"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { use } from "react";
import { updateDepartment } from "@/app/actions/departments";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function EditDepartmentPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [dept, setDept] = useState<any>(null);

  const boundUpdate = updateDepartment.bind(null, parseInt(id));
  const [state, action, isPending] = useActionState(boundUpdate, undefined);

  useEffect(() => {
    fetch(`/api/departments/${id}`).then((r) => r.json()).then((d) => setDept(d.department));
  }, [id]);

  if (!dept) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  const err = (f: string) => state?.errors?.[f]?.[0];

  return (
    <div>
      <div className="mb-4">
        <Link href="/departments" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Departments
        </Link>
      </div>
      <PageHeader title="Edit Department" subtitle={dept.name} />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-md">
        <form action={action} className="space-y-4">
          <Input label="Department Name" name="name" required defaultValue={dept.name} error={err("name")} />
          <div className="flex gap-3">
            <Button type="submit" isPending={isPending}>Save Changes</Button>
            <Link href="/departments"><Button type="button" variant="outline">Cancel</Button></Link>
          </div>
          {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
        </form>
      </div>
    </div>
  );
}
