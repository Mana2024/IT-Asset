import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await ctx.params;
  const db = getDb();
  const department = db.prepare("SELECT * FROM departments WHERE id = ?").get(parseInt(id));
  if (!department) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ department });
}
