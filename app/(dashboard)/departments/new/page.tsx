"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createDepartment } from "@/app/actions/departments";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewDepartmentPage() {
  const [state, action, isPending] = useActionState(createDepartment, undefined);

  const err = (f: string) => state?.errors?.[f]?.[0];

  return (
    <div>
      <PageHeader title="Add Department" subtitle="Create a new department" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-md">
        <form action={action} className="space-y-4">
          <Input label="Department Name" name="name" required error={err("name")} placeholder="e.g. Finance, Operations" />
          <div className="flex gap-3">
            <Button type="submit" isPending={isPending}>Create Department</Button>
            <Link href="/departments"><Button type="button" variant="outline">Cancel</Button></Link>
          </div>
          {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
        </form>
      </div>
    </div>
  );
}
