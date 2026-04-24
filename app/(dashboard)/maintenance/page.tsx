import Link from "next/link";
import { Plus, Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export default async function MaintenancePage(props: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  const sp = await props.searchParams;
  const db = getDb();
  const status = sp.status ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params: any[] = [];
  if (status) { where += " AND ml.status = ?"; params.push(status); }

  const logs = db.prepare(`
    SELECT ml.*, a.asset_id as asset_asset_id, a.name as asset_name, a.category as asset_category,
           u.name as logged_by_name
    FROM maintenance_logs ml
    JOIN assets a ON ml.asset_id = a.id
    LEFT JOIN users u ON ml.logged_by = u.id
    ${where} ORDER BY ml.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM maintenance_logs ml ${where}`).get(...params) as any).cnt;
  const totalPages = Math.ceil(total / limit);
  const STATUSES = ["", "Open", "In Progress", "Completed", "Cancelled"];

  return (
    <div>
      <PageHeader
        title="Maintenance & Repairs"
        subtitle={`${total} total records`}
        actions={
          <Link href="/maintenance/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Log Maintenance
          </Link>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <Link key={s || "all"} href={`?status=${s}`} className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${status === s ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{s || "All"}</Link>
          ))}
        </div>

        {logs.length === 0 ? (
          <EmptyState icon={Wrench} title="No maintenance records" description="Log a maintenance or repair event." actionLabel="Log Maintenance" actionHref="/maintenance/new" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Asset</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cost</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{log.asset_name}</p>
                      <p className="font-mono text-xs text-gray-400">{log.asset_asset_id}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.maintenance_type}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{log.description}</td>
                    <td className="px-4 py-3 text-gray-600">{log.vendor_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.status === "Completed" ? "bg-green-100 text-green-700"
                        : log.status === "In Progress" ? "bg-yellow-100 text-yellow-700"
                        : log.status === "Open" ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                      }`}>{log.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.actual_cost ? `$${log.actual_cost.toLocaleString()}` : log.estimated_cost ? `~$${log.estimated_cost.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/maintenance/${log.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && <Link href={`?page=${page - 1}&status=${status}`} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">Previous</Link>}
              {page < totalPages && <Link href={`?page=${page + 1}&status=${status}`} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
