import Link from "next/link";
import { Plus, FileText, Printer, Wrench, Building2 } from "lucide-react";
import { PrintButtons } from "./PrintButtons";
import { getCurrentUser } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { RequestStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import type { RequestStatus } from "@/lib/types";

const ALL_STATUSES: RequestStatus[] = ["Pending", "IM Review", "JIO Approved", "SIO Approved", "Issued", "Rejected"];

export default async function RequestsPage(props: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  const sp = await props.searchParams;
  const db = getDb();

  const status = sp.status ?? "";
  const q = sp.q ?? "";
  const print = sp.print === "1";
  const page = parseInt(sp.page ?? "1");
  const limit = print ? 9999 : 20;
  const offset = print ? 0 : (page - 1) * limit;

  let where = "WHERE 1=1";
  const params: any[] = [];

  if (user.role === "DEPT_USER") { where += " AND r.requested_by = ?"; params.push(user.id); }
  if (status) { where += " AND r.status = ?"; params.push(status); }
  if (q) { where += " AND (r.request_number LIKE ? OR r.asset_type LIKE ?)"; const qp = `%${q}%`; params.push(qp, qp); }

  const requests = db.prepare(`
    SELECT r.*, d.name as department_name, u.name as requested_by_name,
           a.end_of_life_date as asset_eol_date
    FROM requests r
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN users u ON r.requested_by = u.id
    LEFT JOIN assets a ON r.allocated_asset_id = a.id
    ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM requests r ${where}`).get(...params) as any).cnt;
  const totalPages = Math.ceil(total / limit);

  if (print) {
    return (
      <div className="p-6 print:p-0">
        <div className="mb-4 print:mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Requisitions Report</h1>
          <p className="text-sm text-gray-500">Total: {total} requests · Generated: {new Date().toLocaleString()}</p>
        </div>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Request #</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Worker Name</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Emp. ID</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Designation</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Department</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Asset Type</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Qty</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Status</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">Date</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">End of Life</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="even:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-mono text-xs">{req.request_number}</td>
                <td className="border border-gray-300 px-3 py-2">{req.requester_name ?? req.requested_by_name}</td>
                <td className="border border-gray-300 px-3 py-2 font-mono text-xs">{req.requester_employee_id ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-2">{req.requester_designation ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-2">{req.department_name ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-2">{req.asset_type}</td>
                <td className="border border-gray-300 px-3 py-2">{req.quantity}</td>
                <td className="border border-gray-300 px-3 py-2">{req.status}</td>
                <td className="border border-gray-300 px-3 py-2">{formatDate(req.created_at)}</td>
                <td className="border border-gray-300 px-3 py-2">{req.asset_eol_date ? formatDate(req.asset_eol_date) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <PrintButtons />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Requisitions"
        subtitle={`${total} total requests`}
        actions={
          <div className="flex gap-2">
            <Link href="/requests?print=1" className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
              <Printer className="h-4 w-4" /> Print
            </Link>
            <Link href="/requests/service" className="inline-flex items-center gap-2 px-3 py-2 border border-orange-300 text-orange-700 text-sm rounded-lg hover:bg-orange-50">
              <Wrench className="h-4 w-4" /> Return / Repair
            </Link>
            {user.role === "INVENTORY_MANAGER" && (
              <Link href="/requests/external" className="inline-flex items-center gap-2 px-3 py-2 border border-purple-300 text-purple-700 text-sm rounded-lg hover:bg-purple-50">
                <Building2 className="h-4 w-4" /> Issue to NGO / School
              </Link>
            )}
            <Link href="/requests/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New Request
            </Link>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <form className="flex items-center gap-2 flex-wrap flex-1">
            <input name="q" defaultValue={q} placeholder="Search by number or asset type..." className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select name="status" defaultValue={status} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Filter</button>
          </form>
        </div>

        {requests.length === 0 ? (
          <EmptyState icon={FileText} title="No requests found" description="Submit a new asset requisition." actionLabel="New Request" actionHref="/requests/new" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Request #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Worker Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Asset Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">End of Life</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{req.request_number}</td>
                    <td className="px-4 py-3 text-gray-900">{req.requester_name ?? req.requested_by_name}</td>
                    <td className="px-4 py-3 text-gray-600">{req.department_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{req.asset_type}</td>
                    <td className="px-4 py-3 text-gray-600">{req.quantity}</td>
                    <td className="px-4 py-3"><RequestStatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{req.asset_eol_date ? formatDate(req.asset_eol_date) : "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/requests/${req.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View</Link>
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
              {page > 1 && <Link href={`?page=${page - 1}&q=${q}&status=${status}`} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">Previous</Link>}
              {page < totalPages && <Link href={`?page=${page + 1}&q=${q}&status=${status}`} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
