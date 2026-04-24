import "server-only";
import type { Database } from "better-sqlite3";

export function generateAssetId(db: Database): string {
  const year = new Date().getFullYear();
  const row = db
    .prepare(
      `SELECT asset_id FROM assets WHERE asset_id LIKE 'AST-${year}-%' ORDER BY id DESC LIMIT 1`
    )
    .get() as { asset_id: string } | undefined;
  const lastNum = row ? parseInt(row.asset_id.split("-")[2], 10) : 0;
  return `AST-${year}-${String(lastNum + 1).padStart(4, "0")}`;
}

export function generateRequestNumber(db: Database): string {
  const year = new Date().getFullYear();
  const row = db
    .prepare(
      `SELECT request_number FROM requests WHERE request_number LIKE 'REQ-${year}-%' ORDER BY id DESC LIMIT 1`
    )
    .get() as { request_number: string } | undefined;
  const lastNum = row ? parseInt(row.request_number.split("-")[2], 10) : 0;
  return `REQ-${year}-${String(lastNum + 1).padStart(4, "0")}`;
}


export function generateEmployeeId(db: Database): string {
  const row = db
    .prepare(`SELECT employee_id FROM users ORDER BY id DESC LIMIT 1`)
    .get() as { employee_id: string } | undefined;
  const lastNum = row ? parseInt(row.employee_id.split("-")[1], 10) : 0;
  return `EMP-${String(lastNum + 1).padStart(3, "0")}`;
}
