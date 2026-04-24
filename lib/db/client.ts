import "server-only";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH ?? "./data/asset-it.db";
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    const schema = readFileSync(join(process.cwd(), "lib/db/schema.sql"), "utf-8");
    db.exec(schema);
    seedIfEmpty(db);
  }
  return db;
}

function seedIfEmpty(db: Database.Database) {
  const userCount = (db.prepare("SELECT COUNT(*) as cnt FROM users").get() as { cnt: number }).cnt;
  if (userCount > 0) return;

  const bcrypt = require("bcryptjs");

  db.prepare(`INSERT INTO departments (name) VALUES ('IT Department')`).run();
  const deptId = (db.prepare("SELECT id FROM departments WHERE name = 'IT Department'").get() as { id: number }).id;

  const insertUser = db.prepare(`
    INSERT INTO users (employee_id, name, email, password_hash, role, department_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run("EMP-001", "System Admin", "admin@assetit.com", bcrypt.hashSync("admin123", 10), "INVENTORY_MANAGER", deptId);
  insertUser.run("EMP-002", "Sarah Inspector", "sio@assetit.com", bcrypt.hashSync("password123", 10), "SIO", deptId);
  insertUser.run("EMP-003", "David Director", "jio@assetit.com", bcrypt.hashSync("password123", 10), "JIO", deptId);
  insertUser.run("EMP-004", "Alice User", "dept@assetit.com", bcrypt.hashSync("password123", 10), "DEPT_USER", deptId);
}
