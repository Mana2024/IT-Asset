"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getDb, type DbHandle } from "@/lib/db/client";
import { withTransaction } from "@/lib/db/transaction";
import { ASSET_TYPE_CATEGORY, ASSET_TYPE_CODE } from "@/lib/types";
import { recordAssetEvent } from "@/lib/history";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

// Auto-generates asset IDs as {CODE}-{YEAR}-{seq}, e.g. DSK-2026-004, continuing
// the highest existing sequence number for that type + year.
async function generateAssetIds(db: DbHandle, assetType: string, count: number): Promise<string[]> {
  const code = ASSET_TYPE_CODE[assetType] ?? assetType.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  const year = new Date().getFullYear();
  const prefix = `${code}-${year}-`;

  const existing = await db.prepare("SELECT asset_id FROM assets WHERE asset_id LIKE ?").all(`${prefix}%`) as { asset_id: string }[];
  let maxSeq = 0;
  for (const { asset_id } of existing) {
    const n = parseInt(asset_id.slice(prefix.length), 10);
    if (!isNaN(n) && n > maxSeq) maxSeq = n;
  }

  return Array.from({ length: count }, (_, i) => `${prefix}${String(maxSeq + i + 1).padStart(3, "0")}`);
}

export async function createAsset(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const asset_type = (formData.get("asset_type") as string)?.trim();
  const specifications = (formData.get("specifications") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  // New assets always start Available and unassigned — they sit in general inventory
  // until actually issued to a department. Serial numbers are recorded at assignment time.
  const status = "Available";
  const department_id = null;
  const quantity = Math.max(1, parseInt(formData.get("quantity") as string) || 1);
  const ict_category = ASSET_TYPE_CATEGORY[asset_type] ?? null;

  if (!asset_type) return { errors: { asset_type: ["Asset type is required"] } };

  const ids = await generateAssetIds(db, asset_type, quantity);
  for (const bulkId of ids) {
    const existing = await db.prepare("SELECT id FROM assets WHERE asset_id = ?").get(bulkId);
    if (existing) return { errors: { asset_type: [`Generated asset ID "${bulkId}" already exists — please retry`] } };
  }

  // recordAssetEvent runs on the pool (not this transaction's connection), so it can't
  // run inside the transaction — it would block waiting to see a row inserted by a
  // still-uncommitted transaction on a different connection. Collect the new ids and
  // record history after the transaction commits instead.
  const insertedIds: number[] = [];
  await withTransaction(async (tx) => {
    for (const id of ids) {
      const r = await tx.prepare(`
        INSERT INTO assets (asset_id, asset_type, specifications, description, status, department_id, ict_category, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, asset_type, specifications, description, status, department_id, ict_category, userId);
      insertedIds.push(r.insertId);
    }
  });
  for (const insertedId of insertedIds) {
    await recordAssetEvent(insertedId, "Created", userId, `Type: ${asset_type}`);
  }

  revalidatePath("/", "layout");
  redirect("/assets");
}

export async function updateAsset(id: number, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const asset_id = (formData.get("asset_id") as string)?.trim();
  const asset_type = (formData.get("asset_type") as string)?.trim();
  const serial_number = (formData.get("serial_number") as string)?.trim();
  const mac_address = (formData.get("mac_address") as string)?.trim() || null;
  const specifications = (formData.get("specifications") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const status = formData.get("status") as string;
  let department_id = formData.get("department_id") ? parseInt(formData.get("department_id") as string) : null;
  let room_number = (formData.get("room_number") as string)?.trim() || null;
  // When updating, if status is set to Available, clear department/room assignment
  if (status === "Available") { department_id = null; room_number = null; }
  const ict_category = ASSET_TYPE_CATEGORY[asset_type] ?? null;

  if (!asset_id) return { errors: { asset_id: ["Asset ID is required"] } };
  if (!asset_type) return { errors: { asset_type: ["Asset type is required"] } };
  if (!specifications) return { errors: { specifications: ["Specifications are required"] } };
  if (!serial_number) return { errors: { serial_number: ["Serial number is required"] } };

  const existing = await db.prepare("SELECT id FROM assets WHERE asset_id = ? AND id != ?").get(asset_id, id);
  if (existing) return { errors: { asset_id: ["Asset ID already in use by another asset"] } };

  if (serial_number) {
    const snExists = await db.prepare("SELECT id FROM assets WHERE serial_number = ? AND id != ?").get(serial_number, id);
    if (snExists) return { errors: { serial_number: ["Serial number already registered on another asset"] } };
  }

  const before = await db.prepare("SELECT status FROM assets WHERE id = ?").get(id) as any;
  const issued_date = (formData.get("issued_date") as string)?.trim() || null;
  const end_of_life_date = (formData.get("end_of_life_date") as string)?.trim() || null;

  await db.prepare(`
    UPDATE assets SET asset_id=?, asset_type=?, serial_number=?, mac_address=?, specifications=?, description=?, status=?, department_id=?, room_number=?,
      ict_category=?, issued_date=?, end_of_life_date=?, updated_at=NOW()
    WHERE id=?
  `).run(asset_id, asset_type, serial_number, mac_address, specifications, description, status, department_id, room_number, ict_category, issued_date, end_of_life_date, id);

  const notes = before?.status !== status ? `Status changed: ${before?.status} → ${status}` : "Details updated";
  await recordAssetEvent(id, "Updated", userId, notes);

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}`);
}

export async function restoreToInventory(id: number) {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return;
  const db = getDb();
  const result = await db.prepare("UPDATE assets SET status='Available', updated_at=NOW() WHERE id=? AND status='Returned'").run(id);
  if (result.affectedRows > 0) await recordAssetEvent(id, "Restored to Inventory", userId);
  revalidatePath("/", "layout");
  redirect(`/assets/${id}`);
}

export async function recordDisposal(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const id               = parseInt(formData.get("asset_id") as string);
  const disposal_method    = (formData.get("disposal_method") as string)?.trim() || null;
  const disposal_recycler  = (formData.get("disposal_recycler") as string)?.trim() || null;
  const disposal_reference = (formData.get("disposal_reference") as string)?.trim() || null;

  const db = getDb();
  const asset = await db.prepare("SELECT * FROM assets WHERE id = ? AND status = 'Condemned'").get(id) as any;
  if (!asset) return { errors: { _: ["Asset not found or not in Condemned status"] } };

  await db.prepare(`
    UPDATE assets SET status='Disposed', disposal_method=?, disposal_recycler=?, disposal_reference=?,
    disposal_date=CURDATE(), updated_at=NOW() WHERE id=?
  `).run(disposal_method, disposal_recycler, disposal_reference, id);

  const notes = [
    disposal_method ? `Method: ${disposal_method}` : null,
    disposal_recycler ? `Recycler: ${disposal_recycler}` : null,
    disposal_reference ? `Ref: ${disposal_reference}` : null,
  ].filter(Boolean).join(" · ") || "Disposed";
  await recordAssetEvent(id, "Disposed", userId, notes);

  revalidatePath("/", "layout");
  redirect(`/assets/${id}`);
}

export async function deleteAsset(id: number) {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return;
  const db = getDb();
  const asset = await db.prepare("SELECT status FROM assets WHERE id = ?").get(id) as any;
  if (!asset || asset.status !== "Available") return;
  await withTransaction(async (tx) => {
    await tx.setForeignKeyChecks(false);
    await tx.run("DELETE FROM asset_history WHERE asset_id = ?", id);
    await tx.run("DELETE FROM assets WHERE id = ?", id);
    await tx.setForeignKeyChecks(true);
  });
  revalidatePath("/assets");
  redirect("/assets");
}
