import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  await verifySession();
  const db = getDb();
  const sp = request.nextUrl.searchParams;
  const status = sp.get("status") ?? "Active";
  const page = parseInt(sp.get("page") ?? "1");
  const limit = parseInt(sp.get("limit") ?? "20");
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
  `).all(status, limit, offset);

  const total = (db.prepare("SELECT COUNT(*) as cnt FROM asset_assignments WHERE status = ?").get(status) as any).cnt;
  return Response.json({ assignments, total });
}
