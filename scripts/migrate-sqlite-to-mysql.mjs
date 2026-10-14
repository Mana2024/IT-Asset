// One-off data migration: copies every table from the old SQLite file into the new
// MySQL database, in FK-safe order, preserving explicit id values so existing foreign
// keys stay valid. Run once, after `lib/db/schema.sql` has been applied to MySQL.
//
// Usage: node scripts/migrate-sqlite-to-mysql.mjs
// Reads SQLITE_SOURCE_PATH and DATABASE_URL from .env.local.

import { readFileSync } from "fs";
import Database from "better-sqlite3";
import mysql from "mysql2/promise";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const TABLES_IN_ORDER = [
  "departments",
  "users",
  "employees",
  "assets",
  "eol_policies",
  "requests",
  "approvals",
  "request_items",
  "asset_history",
  "asset_transfers",
  "inventory_verifications",
  "password_reset_tokens",
  "email_otp",
];

async function main() {
  const sqlitePath = process.env.SQLITE_SOURCE_PATH ?? "./data/it-asset.db";
  const sqlite = new Database(sqlitePath, { readonly: true });
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const table of TABLES_IN_ORDER) {
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) {
        console.log(`${table}: 0 rows, skipped`);
        continue;
      }
      const cols = Object.keys(rows[0]);
      const placeholders = `(${cols.map(() => "?").join(",")})`;
      const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES ${rows.map(() => placeholders).join(",")}`;
      const values = rows.flatMap((r) => cols.map((c) => r[c]));
      const [result] = await conn.query(sql, values);
      console.log(`${table}: inserted ${result.affectedRows} rows`);
    }
  } finally {
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  console.log("\nRow-count parity check:");
  for (const table of TABLES_IN_ORDER) {
    const sqliteCount = sqlite.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
    const [[{ c: mysqlCount }]] = await conn.query(`SELECT COUNT(*) as c FROM ${table}`);
    const ok = sqliteCount === mysqlCount ? "OK" : "MISMATCH";
    console.log(`  ${table}: sqlite=${sqliteCount} mysql=${mysqlCount} [${ok}]`);
  }

  sqlite.close();
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
