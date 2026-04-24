"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

      {state?.error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@assetit.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
        <Button type="submit" isPending={isPending} className="w-full mt-2" size="lg">
          Sign in
        </Button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Demo Accounts</p>
        <div className="space-y-1 text-xs text-gray-600">
          <p><span className="font-medium">Inventory Manager:</span> admin@assetit.com / admin123</p>
          <p><span className="font-medium">SIO:</span> sio@assetit.com / password123</p>
          <p><span className="font-medium">JIO:</span> jio@assetit.com / password123</p>
          <p><span className="font-medium">Dept User:</span> dept@assetit.com / password123</p>
        </div>
      </div>
    </div>
  );
}
