import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  await verifySession();
  const db = getDb();
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type") ?? "utilization";
  const from = sp.get("from");
  const to = sp.get("to");

  let data: any[] = [];

  if (type === "utilization") {
    data = db.prepare(`
      SELECT a.category, a.status, COUNT(*) as count,
             ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM assets), 2) as percentage
      FROM assets a GROUP BY a.category, a.status ORDER BY a.category
    `).all();
  } else if (type === "department") {
    data = db.prepare(`
      SELECT d.name as department, a.category, a.status, COUNT(*) as count
      FROM assets a LEFT JOIN departments d ON a.department_id = d.id
      GROUP BY d.name, a.category, a.status ORDER BY d.name, a.category
    `).all();
  } else if (type === "external") {
    data = db.prepare(`
      SELECT eo.name as organization, eo.type, COUNT(aa.id) as active_assignments,
             GROUP_CONCAT(DISTINCT a.category) as asset_categories
      FROM external_organizations eo
      LEFT JOIN asset_assignments aa ON aa.external_org_id = eo.id AND aa.status = 'Active'
      LEFT JOIN assets a ON aa.asset_id = a.id
      GROUP BY eo.id ORDER BY eo.type, eo.name
    `).all();
  } else if (type === "requests") {
    let where = "WHERE 1=1";
    const params: any[] = [];
    if (from) { where += " AND r.created_at >= ?"; params.push(from); }
    if (to) { where += " AND r.created_at <= ?"; params.push(to + " 23:59:59"); }
    data = db.prepare(`
      SELECT r.request_number, r.request_type, r.status, r.asset_category, r.quantity,
             r.requester_name, r.created_at, u.name as created_by
      FROM requests r LEFT JOIN users u ON r.created_by = u.id
      ${where} ORDER BY r.created_at DESC
    `).all(...params);
  } else if (type === "maintenance") {
    data = db.prepare(`
      SELECT a.asset_id, a.name as asset_name, a.category,
             COUNT(ml.id) as total_maintenance, SUM(ml.actual_cost) as total_cost,
             MAX(ml.completed_at) as last_serviced
      FROM assets a LEFT JOIN maintenance_logs ml ON ml.asset_id = a.id
      GROUP BY a.id ORDER BY total_maintenance DESC
    `).all();
  }

  return Response.json({ data, type });
}
