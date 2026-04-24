import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await ctx.params;
  const db = getDb();

  const request = db.prepare(`
    SELECT r.*, d.name as department_name,
           u.name as requested_by_name,
           u.employee_id as requested_by_empid,
           u.email as requested_by_email,
           ta.asset_id as tentative_asset_code, ta.asset_type as tentative_asset_type
    FROM requests r
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN users u ON r.requested_by = u.id
    LEFT JOIN assets ta ON r.tentative_asset_id = ta.id
    WHERE r.id = ?
  `).get(parseInt(id)) as any;

  if (!request) return Response.json({ error: "Not found" }, { status: 404 });

  const approvals = db.prepare(`
    SELECT a.*, u.name as reviewer_name
    FROM approvals a
    LEFT JOIN users u ON a.reviewer_id = u.id
    WHERE a.request_id = ? ORDER BY a.created_at ASC
  `).all(parseInt(id));

  return Response.json({ request, approvals });
}
