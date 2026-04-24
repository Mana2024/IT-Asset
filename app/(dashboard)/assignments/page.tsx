import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export default async function AssignmentsPage(props: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  const sp = await props.searchParams;
  const db = getDb();
  const status = sp.status ?? "Active";
  const page = parseInt(sp.page ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const assignments = db.prepare(`
    SELECT aa.*, a.asset_id as asset_asset_id, a.name as asset_name, a.category as asset_category,
           d.name as department_name, eo.name as external_org_name, u.name as issued_by_name
    FROM asset_assignments aa
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN departments d ON aa.department_id = d.id
    LEFT JOIN external_organizations eo ON aa.external_org_id = eo.id
    LEFT JOIN users u ON aa.issued_by = u.id
    WHERE aa.status = ? ORDER BY aa.created_at DESC LIMIT ? OFFSET ?
  `).all(status, limit, offset) as any[];

  const total = (db.prepare("SELECT COUNT(*) as cnt FROM asset_assignments WHERE status = ?").get(status) as any).cnt;
  const totalPages = Math.ceil(total / limit);

  const STATUSES = ["Active", "Returned", "Lost", "Written Off"];

  return (
    <div>
      <PageHeader
        title="Asset Assignments"
        subtitle={`${total} ${status.toLowerCase()} assignments`}
        actions={
          user.role === "INVENTORY_MANAGER" ? (
            <Link href="/assignments/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New Assignment
            </Link>
          ) : undefined
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex gap-2">
          {STATUSES.map((s) => (
            <Link key={s} href={`?status=${s}`} className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${status === s ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{s}</Link>
          ))}
        </div>

        {assignments.length === 0 ? (
          <EmptyState icon={Package} title={`No ${status.toLowerCase()} assignments`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Asset</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned To</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Department/Org</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Issued Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Expected Return</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Issued By</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{a.asset_name}</p>
                      <p className="font-mono text-xs text-blue-600">{a.asset_asset_id}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.assigned_to_name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{a.assigned_to_type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.department_name ?? a.external_org_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(a.assigned_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(a.expected_return_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{a.issued_by_name}</td>
                    <td className="px-4 py-3">
                      <Link href={`/assignments/${a.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</p>
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
