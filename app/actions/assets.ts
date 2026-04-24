"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createAsset(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const asset_id = (formData.get("asset_id") as string)?.trim();
  const asset_type = (formData.get("asset_type") as string)?.trim();
  const serial_number = (formData.get("serial_number") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const department_id = formData.get("department_id") ? parseInt(formData.get("department_id") as string) : null;
  const status = (formData.get("status") as string) || "Available";

  if (!asset_id) return { errors: { asset_id: ["Asset ID is required"] } };
  if (!asset_type) return { errors: { asset_type: ["Asset type is required"] } };

  const existing = db.prepare("SELECT id FROM assets WHERE asset_id = ?").get(asset_id);
  if (existing) return { errors: { asset_id: ["Asset ID already exists"] } };

  if (serial_number) {
    const snExists = db.prepare("SELECT id FROM assets WHERE serial_number = ?").get(serial_number);
    if (snExists) return { errors: { serial_number: ["Serial number already registered"] } };
  }

  db.prepare(`
    INSERT INTO assets (asset_id, asset_type, serial_number, description, status, department_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(asset_id, asset_type, serial_number, description, status, department_id, userId);

  revalidatePath("/assets");
  redirect("/assets");
}

export async function updateAsset(id: number, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const asset_id = (formData.get("asset_id") as string)?.trim();
  const asset_type = (formData.get("asset_type") as string)?.trim();
  const serial_number = (formData.get("serial_number") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const status = formData.get("status") as string;
  const department_id = formData.get("department_id") ? parseInt(formData.get("department_id") as string) : null;

  if (!asset_id) return { errors: { asset_id: ["Asset ID is required"] } };
  if (!asset_type) return { errors: { asset_type: ["Asset type is required"] } };

  const existing = db.prepare("SELECT id FROM assets WHERE asset_id = ? AND id != ?").get(asset_id, id);
  if (existing) return { errors: { asset_id: ["Asset ID already in use by another asset"] } };

  if (serial_number) {
    const snExists = db.prepare("SELECT id FROM assets WHERE serial_number = ? AND id != ?").get(serial_number, id);
    if (snExists) return { errors: { serial_number: ["Serial number already registered on another asset"] } };
  }

  db.prepare(`
    UPDATE assets SET asset_id=?, asset_type=?, serial_number=?, description=?, status=?, department_id=?,
      updated_at=datetime('now')
    WHERE id=?
  `).run(asset_id, asset_type, serial_number, description, status, department_id, id);

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}`);
}

export async function deleteAsset(id: number) {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return;
  const db = getDb();
  db.prepare("DELETE FROM assets WHERE id = ? AND status = 'Available'").run(id);
  revalidatePath("/assets");
  redirect("/assets");
}
