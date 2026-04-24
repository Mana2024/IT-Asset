"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function logMaintenance(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId } = await verifySession();
  const db = getDb();

  const asset_id = parseInt(formData.get("asset_id") as string);
  const maintenance_type = formData.get("maintenance_type") as string;
  const description = (formData.get("description") as string)?.trim();
  const vendor_name = (formData.get("vendor_name") as string)?.trim() || null;
  const vendor_contact = (formData.get("vendor_contact") as string)?.trim() || null;
  const estimated_cost = formData.get("estimated_cost") ? parseFloat(formData.get("estimated_cost") as string) : null;
  const started_at = (formData.get("started_at") as string) || null;
  const next_service_date = (formData.get("next_service_date") as string) || null;

  if (!asset_id) return { errors: { asset_id: ["Asset is required"] } };
  if (!description) return { errors: { description: ["Description is required"] } };

  const logInTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO maintenance_logs (asset_id, maintenance_type, description, vendor_name,
        vendor_contact, estimated_cost, started_at, next_service_date, status, logged_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'In Progress', ?)
    `).run(asset_id, maintenance_type, description, vendor_name, vendor_contact,
      estimated_cost, started_at, next_service_date, userId);

    db.prepare("UPDATE assets SET status='In Repair', updated_at=datetime('now') WHERE id=?").run(asset_id);
  });

  logInTx();
  revalidatePath("/maintenance");
  revalidatePath("/assets");
  redirect("/maintenance");
}

export async function closeMaintenance(id: number, actual_cost: number | null, notes: string) {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return;

  const db = getDb();
  const log = db.prepare("SELECT * FROM maintenance_logs WHERE id = ?").get(id) as any;
  if (!log) return;

  const closeInTx = db.transaction(() => {
    db.prepare(`
      UPDATE maintenance_logs SET status='Completed', actual_cost=?, notes=?,
        completed_at=datetime('now'), updated_at=datetime('now') WHERE id=?
    `).run(actual_cost, notes || null, id);
    db.prepare("UPDATE assets SET status='Available', updated_at=datetime('now') WHERE id=?").run(log.asset_id);
  });

  closeInTx();
  revalidatePath("/maintenance");
  revalidatePath("/assets");
}
