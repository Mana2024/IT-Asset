"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createAssignment(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const asset_id = parseInt(formData.get("asset_id") as string);
  const assigned_to_name = (formData.get("assigned_to_name") as string)?.trim();
  const assigned_to_type = formData.get("assigned_to_type") as string;
  const department_id = formData.get("department_id") ? parseInt(formData.get("department_id") as string) : null;
  const external_org_id = formData.get("external_org_id") ? parseInt(formData.get("external_org_id") as string) : null;
  const expected_return_date = (formData.get("expected_return_date") as string) || null;
  const condition_on_issue = (formData.get("condition_on_issue") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!asset_id) return { errors: { asset_id: ["Asset is required"] } };
  if (!assigned_to_name) return { errors: { assigned_to_name: ["Assignee name is required"] } };

  const asset = db.prepare("SELECT * FROM assets WHERE id = ? AND status = 'Available'").get(asset_id) as any;
  if (!asset) return { errors: { asset_id: ["Asset is not available"] } };

  const assignInTx = db.transaction(() => {
    db.prepare("UPDATE assets SET status='Assigned', updated_at=datetime('now') WHERE id=?").run(asset_id);
    db.prepare(`
      INSERT INTO asset_assignments (asset_id, assigned_to_name, assigned_to_type, department_id,
        external_org_id, expected_return_date, condition_on_issue, notes, issued_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(asset_id, assigned_to_name, assigned_to_type, department_id, external_org_id,
      expected_return_date, condition_on_issue, notes, userId);
  });

  assignInTx();
  revalidatePath("/assignments");
  revalidatePath("/assets");
  redirect("/assignments");
}

export async function returnAsset(assignmentId: number, condition: string, notes: string) {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return;

  const db = getDb();
  const assignment = db.prepare("SELECT * FROM asset_assignments WHERE id = ?").get(assignmentId) as any;
  if (!assignment || assignment.status !== "Active") return;

  const returnInTx = db.transaction(() => {
    db.prepare(`
      UPDATE asset_assignments SET status='Returned', actual_return_date=date('now'),
        condition_on_return=?, notes=COALESCE(notes || ' | Return: ' || ?, notes, ?),
        updated_at=datetime('now') WHERE id=?
    `).run(condition || null, notes, notes, assignmentId);
    db.prepare("UPDATE assets SET status='Available', updated_at=datetime('now') WHERE id=?").run(assignment.asset_id);
  });

  returnInTx();
  revalidatePath("/assignments");
  revalidatePath("/assets");
}
