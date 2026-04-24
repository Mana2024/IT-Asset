import type { ReactNode } from "react";
import { Cpu } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 rounded-2xl p-3 mb-4">
            <Cpu className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Asset-IT System</h1>
          <p className="text-sm text-gray-500 mt-1">IT Asset Management & Tracking</p>
        </div>
        {children}
      </div>
    </div>
  );
}
