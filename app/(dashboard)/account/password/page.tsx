"use client";

import { useActionState, useEffect, useState } from "react";
import { changeOwnPassword, updateOwnProfile } from "@/app/actions/users";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AccountPage() {
  const [profileState, profileAction, profilePending] = useActionState(updateOwnProfile, undefined);
  const [pwState, pwAction, pwPending] = useActionState(changeOwnPassword, undefined);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setProfile(d.user));
  }, [profileState?.message]);

  const pErr = (f: string) => profileState?.errors?.[f]?.[0];
  const wErr = (f: string) => pwState?.errors?.[f]?.[0];

  return (
    <div>
      <PageHeader title="My Account" subtitle="Manage your profile and password" />

      <div className="space-y-6 max-w-xl">

        {/* Profile Info (read-only display) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Account Info</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {[
              ["Name", profile?.name],
              ["Employee ID", profile?.employee_id],
              ["Email", profile?.email],
              ["Role", profile?.role],
              ["Department", profile?.department_name ?? "—"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Designation & Phone */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Work Details</h3>
          <p className="text-xs text-gray-500 mb-4">These will be auto-filled when you submit an asset request.</p>

          {profileState?.message && !profileState.errors && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">{profileState.message}</p>
            </div>
          )}

          {profile ? (
            <form action={profileAction} className="space-y-4">
              <Input
                label="Designation"
                name="designation"
                defaultValue={profile.designation ?? ""}
                placeholder="e.g. Software Engineer, Lab Technician"
                error={pErr("designation")}
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                placeholder="e.g. +91-9876543210"
                error={pErr("phone")}
              />
              <Button type="submit" isPending={profilePending}>Save Details</Button>
            </form>
          ) : (
            <p className="text-sm text-gray-400">Loading...</p>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>

          {pwState?.message && !pwState.errors && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">{pwState.message}</p>
            </div>
          )}

          <form action={pwAction} className="space-y-4">
            <Input label="Current Password" name="current_password" type="password" required error={wErr("current_password")} placeholder="Your current password" />
            <Input label="New Password" name="new_password" type="password" required error={wErr("new_password")} placeholder="Min. 6 characters" />
            <Input label="Confirm New Password" name="confirm_password" type="password" required error={wErr("confirm_password")} placeholder="Repeat new password" />
            <Button type="submit" isPending={pwPending}>Change Password</Button>
          </form>
        </div>

      </div>
    </div>
  );
}
