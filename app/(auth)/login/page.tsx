"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/public-auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [loginState, loginAction, loginPending] = useActionState(login, undefined);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      {/* ── LOGIN FORM ── */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

      {loginState?.error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loginState.error}
        </div>
      )}

      <form action={loginAction} className="space-y-4" autoComplete="off">
        <Input label="Email address" name="email" type="email" placeholder="you@example.com" required autoComplete="off" />
        <Input label="Password" name="password" type="password" placeholder="••••••••" required autoComplete="new-password" />
        <p className="text-xs text-gray-500">Forgot your password? Contact your Inventory Manager to have it reset.</p>
        <Button type="submit" isPending={loginPending} className="w-full mt-2" size="lg">Sign in</Button>
      </form>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 border border-gray-100 rounded-xl p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 mb-3">Default accounts</p>
          <div className="space-y-2">
            {[
              { role: "Inventory Manager", email: "im@nitm.ac.in",    password: "Admin@123" },
              { role: "SIO",               email: "sio@nitm.ac.in",   password: "Admin@123" },
              { role: "JIO",               email: "jio@nitm.ac.in",   password: "Admin@123" },
              { role: "Dept User",         email: "head@nitm.ac.in",  password: "Admin@123" },
            ].map(({ role, email, password }) => (
              <div key={email} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 w-36">{role}</span>
                <span className="font-mono text-gray-700">{email}</span>
                <span className="font-mono text-gray-400">{password}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
