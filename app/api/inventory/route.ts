import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

export async function GET() {
  await verifySession();
  const db = getDb();

  const summary = db.prepare(`
    SELECT category, status, COUNT(*) as count
    FROM assets GROUP BY category, status ORDER BY category, status
  `).all();

  const byDept = db.prepare(`
    SELECT d.name as department, a.status, COUNT(*) as count
    FROM assets a LEFT JOIN departments d ON a.department_id = d.id
    GROUP BY d.name, a.status ORDER BY d.name
  `).all();

  const totals = db.prepare(`
    SELECT status, COUNT(*) as count FROM assets GROUP BY status
  `).all();

  const categories = db.prepare(`
    SELECT DISTINCT category FROM assets ORDER BY category
  `).all();

  return Response.json({ summary, byDept, totals, categories });
}
