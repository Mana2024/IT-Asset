"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createRequest } from "@/app/actions/requests";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetTypeSelect } from "@/components/ui/AssetTypeSelect";

export default function NewRequestPage() {
  const [state, action, isPending] = useActionState(createRequest, undefined);

  const err = (field: string) => state?.errors?.[field]?.[0];

  return (
    <div>
      <PageHeader title="New Requisition" subtitle="Submit a request for IT assets" />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        <form action={action} className="space-y-5">

          {/* Worker Details — entered by request head */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1 pb-2 border-b border-gray-100">Worker Details</h3>
            <p className="text-xs text-gray-500 mb-3">Enter the details of the person requesting the asset.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Employee Name"
                name="requester_name"
                required
                placeholder="Full name of the worker"
                error={err("requester_name")}
              />
              <Input
                label="Employee ID"
                name="requester_employee_id"
                required
                placeholder="e.g. EMP-010"
                error={err("requester_employee_id")}
              />
              <Input
                label="Email Address"
                name="requester_email"
                type="email"
                placeholder="worker@example.com"
                error={err("requester_email")}
              />
              <Input
                label="Phone Number"
                name="requester_phone"
                type="tel"
                required
                placeholder="e.g. +91-9876543210"
                error={err("requester_phone")}
              />
              <Input
                label="Designation"
                name="requester_designation"
                placeholder="e.g. Lab Technician"
                error={err("requester_designation")}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Asset Request */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Asset Request</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AssetTypeSelect required error={err("asset_type")} />
                <Input
                  label="Quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </div>
              <Textarea
                label="Justification"
                name="justification"
                required
                error={err("justification")}
                placeholder="Explain why this asset is needed..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" isPending={isPending}>Submit Request</Button>
            <Link href="/requests"><Button type="button" variant="outline">Cancel</Button></Link>
          </div>
        </form>
      </div>
    </div>
  );
}
