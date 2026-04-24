import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await ctx.params;
  const db = getDb();

  const assignment = db.prepare(`
    SELECT aa.*, a.asset_id as asset_asset_id, a.name as asset_name, a.category as asset_category,
           d.name as department_name, eo.name as external_org_name, u.name as issued_by_name
    FROM asset_assignments aa
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN departments d ON aa.department_id = d.id
    LEFT JOIN external_organizations eo ON aa.external_org_id = eo.id
    LEFT JOIN users u ON aa.issued_by = u.id
    WHERE aa.id = ?
  `).get(parseInt(id));

  if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ assignment });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await ctx.params;
  const { action, condition_on_return, notes } = await request.json();
  const db = getDb();

  if (action === "return") {
    const assignment = db.prepare("SELECT * FROM asset_assignments WHERE id = ?").get(parseInt(id)) as any;
    if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });

    const returnTx = db.transaction(() => {
      db.prepare(`
        UPDATE asset_assignments SET status='Returned', actual_return_date=date('now'),
          condition_on_return=?, updated_at=datetime('now') WHERE id=?
      `).run(condition_on_return || null, parseInt(id));
      db.prepare("UPDATE assets SET status='Available', updated_at=datetime('now') WHERE id=?").run(assignment.asset_id);
    });
    returnTx();
  }

  return Response.json({ success: true });
}
