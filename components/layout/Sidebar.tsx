"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  FileText,
  CheckSquare,
  Building2,
  Users,
  ChevronRight,
  Cpu,
  KeyRound,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assets", href: "/assets", icon: Monitor },
  { label: "Requisitions", href: "/requests", icon: FileText },
  { label: "Approvals", href: "/approvals", icon: CheckSquare, roles: ["INVENTORY_MANAGER", "SIO", "JIO"] },
  { label: "Departments", href: "/departments", icon: Building2, roles: ["INVENTORY_MANAGER"] },
  { label: "User Management", href: "/users", icon: Users, roles: ["INVENTORY_MANAGER"] },
  { label: "Change Password", href: "/account/password", icon: KeyRound },
];

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="w-64 shrink-0 bg-gray-900 text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Cpu className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Asset-IT</p>
          <p className="text-xs text-gray-400">IT Asset Manager</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-3 w-3" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">© 2025 Asset-IT System</p>
      </div>
    </aside>
  );
}
