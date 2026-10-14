import "server-only";
import type { DbHandle } from "@/lib/db/client";

export async function generateRequestNumber(db: DbHandle): Promise<string> {
  const year = new Date().getFullYear();
  const row = await db
    .prepare(
      `SELECT request_number FROM requests WHERE request_number LIKE 'REQ-${year}-%' ORDER BY id DESC LIMIT 1`
    )
    .get() as { request_number: string } | undefined;
  const lastNum = row ? parseInt(row.request_number.split("-")[2], 10) : 0;
  return `REQ-${year}-${String(lastNum + 1).padStart(4, "0")}`;
}

export async function generateEmployeeId(db: DbHandle): Promise<string> {
  const row = await db
    .prepare(`SELECT employee_id FROM users ORDER BY id DESC LIMIT 1`)
    .get() as { employee_id: string } | undefined;
  const lastNum = row ? parseInt(row.employee_id.split("-")[1], 10) : 0;
  return `EMP-${String(lastNum + 1).padStart(3, "0")}`;
}
