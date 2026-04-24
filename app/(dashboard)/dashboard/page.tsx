import { Monitor, FileText, CheckSquare, Users, TrendingUp, Wrench } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetStatusBadge, RequestStatusBadge } from "@/components/ui/Badge";
import type { UserRole } from "@/lib/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const db = getDb();

  const totalAssets = (db.prepare("SELECT COUNT(*) as cnt FROM assets").get() as any).cnt;
  const availableAssets = (db.prepare("SELECT COUNT(*) as cnt FROM assets WHERE status = 'Available'").get() as any).cnt;
  const assignedAssets = (db.prepare("SELECT COUNT(*) as cnt FROM assets WHERE status = 'Assigned'").get() as any).cnt;
  const maintenanceAssets = (db.prepare("SELECT COUNT(*) as cnt FROM assets WHERE status = 'Maintenance'").get() as any).cnt;

  const pendingRequests = (db.prepare("SELECT COUNT(*) as cnt FROM requests WHERE status NOT IN ('Allocated','Rejected')").get() as any).cnt;
  const pendingApprovals = (db.prepare("SELECT COUNT(*) as cnt FROM approvals WHERE status = 'Pending'").get() as any).cnt;
  const totalUsers = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE is_active = 1").get() as any).cnt;

  const recentRequests = db.prepare(`
    SELECT r.*, d.name as department_name, u.name as requested_by_name
    FROM requests r
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN users u ON r.requested_by = u.id
    ORDER BY r.created_at DESC LIMIT 6
  `).all() as any[];

  const recentAssets = db.prepare(`
    SELECT a.*, d.name as department_name
    FROM assets a LEFT JOIN departments d ON a.department_id = d.id
    ORDER BY a.created_at DESC LIMIT 6
  `).all() as any[];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="IT Asset Management Dashboard"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Assets" value={totalAssets} icon={Monitor} color="blue" subtitle="All registered" />
        <StatCard title="Available" value={availableAssets} icon={TrendingUp} color="green" subtitle="Ready to allocate" />
        <StatCard title="Assigned" value={assignedAssets} icon={CheckSquare} color="indigo" subtitle="Currently in use" />
        <StatCard title="Maintenance" value={maintenanceAssets} icon={Wrench} color="yellow" subtitle="Under repair" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Pending Requests" value={pendingRequests} icon={FileText} color="yellow" subtitle="Awaiting action" />
        {(["INVENTORY_MANAGER", "SIO", "JIO"] as UserRole[]).includes(user.role) && (
          <StatCard title="Pending Approvals" value={pendingApprovals} icon={CheckSquare} color="purple" subtitle="Awaiting your review" />
        )}
        {user.role === "INVENTORY_MANAGER" && (
          <StatCard title="Active Users" value={totalUsers} icon={Users} color="blue" subtitle="System users" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Requisitions</h3>
            <Link href="/requests" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentRequests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No requests yet</p>
            ) : recentRequests.map((req) => (
              <Link key={req.id} href={`/requests/${req.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{req.request_number}</p>
                  <p className="text-xs text-gray-500">{req.asset_type} · {req.requested_by_name}</p>
                </div>
                <RequestStatusBadge status={req.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Asset Inventory</h3>
            <Link href="/assets" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAssets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No assets yet</p>
            ) : recentAssets.map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{asset.asset_id}</p>
                  <p className="text-xs text-gray-500">{asset.asset_type} · {asset.department_name ?? "Unassigned"}</p>
                </div>
                <AssetStatusBadge status={asset.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
