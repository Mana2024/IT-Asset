import Link from "next/link";
import { Plus, Search, Printer } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Monitor } from "lucide-react";
import type { AssetStatus } from "@/lib/types";
import { ASSET_TYPES } from "@/lib/types";

export default async function AssetsPage(props: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  const sp = await props.searchParams;
  const db = getDb();

  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const type = sp.type ?? "";
  const print = sp.print === "1";
  const page = parseInt(sp.page ?? "1");
  const limit = print ? 9999 : 20;
  const offset = print ? 0 : (page - 1) * limit;

  let where = "WHERE 1=1";
  const params: any[] = [];
  if (status) { where += " AND a.status = ?"; params.push(status); }
  if (type) { where += " AND a.asset_type = ?"; params.push(type); }
  if (q) { where += " AND (a.asset_id LIKE ? OR a.asset_type LIKE ? OR a.description LIKE ?)"; const qp = `%${q}%`; params.push(qp, qp, qp); }

  const assets = db.prepare(`
    SELECT a.*, d.name as department_name
    FROM assets a LEFT JOIN departments d ON a.department_id = d.id
    ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM assets a ${where}`).get(...params) as any).cnt;
  const totalPages = Math.ceil(total / limit);

  const STATUSES: AssetStatus[] = ["Available", "Assigned", "Maintenance"];

  if (print) {
    return (
      <div className="p-6 print:p-0">
        <div className="mb-4 print:mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Asset Inventory Report</h1>
          <p className="text-sm text-gray-500">Total: {total} assets · Generated: {new Date().toLocaleString()}</p>
        </div>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Asset ID</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Serial No.</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Type</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Description</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Department</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Status</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">End of Life</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="even:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-mono text-xs">{asset.asset_id}</td>
                <td className="border border-gray-300 px-3 py-2 font-mono text-xs">{asset.serial_number ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-2">{asset.asset_type}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600">{asset.description ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-2">{asset.department_name ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-2">{asset.status}</td>
                <td className="border border-gray-300 px-3 py-2">{asset.end_of_life_date ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 print:hidden">
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Print</button>
          <Link href="/assets" className="ml-3 px-4 py-2 border border-gray-300 rounded-lg text-sm">Back</Link>
        </div>
        <script dangerouslySetInnerHTML={{ __html: "window.onload = () => window.print();" }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle={`${total} total assets`}
        actions={
          <div className="flex gap-2">
            <Link href="/assets?print=1" className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
              <Printer className="h-4 w-4" /> Print
            </Link>
            {user.role === "INVENTORY_MANAGER" && (
              <Link href="/assets/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Add Asset
              </Link>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <form className="flex items-center gap-2 flex-1 min-w-64">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by ID, type, description..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select name="status" defaultValue={status} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="type" defaultValue={type} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Types</option>
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Filter</button>
          </form>
        </div>

        {assets.length === 0 ? (
          <EmptyState icon={Monitor} title="No assets found" description="Try adjusting your filters or add a new asset." actionLabel={user.role === "INVENTORY_MANAGER" ? "Add Asset" : undefined} actionHref="/assets/new" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Asset ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Serial No.</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{asset.asset_id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{asset.serial_number ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{asset.asset_type}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{asset.description ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{asset.department_name ?? "—"}</td>
                    <td className="px-4 py-3"><AssetStatusBadge status={asset.status} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View</Link>
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
              {page > 1 && <Link href={`?page=${page - 1}&q=${q}&status=${status}&type=${type}`} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">Previous</Link>}
              {page < totalPages && <Link href={`?page=${page + 1}&q=${q}&status=${status}&type=${type}`} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
