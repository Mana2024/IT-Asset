"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createDepartment(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { errors: { name: ["Department name is required"] } };

  const existing = await db.prepare("SELECT id FROM departments WHERE name = ?").get(name);
  if (existing) return { errors: { name: ["Department name already exists"] } };

  await db.prepare("INSERT INTO departments (name) VALUES (?)").run(name);
  revalidatePath("/departments");
  redirect("/departments");
}

export async function updateDepartment(id: number, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { errors: { name: ["Department name is required"] } };

  const existing = await db.prepare("SELECT id FROM departments WHERE name = ? AND id != ?").get(name, id);
  if (existing) return { errors: { name: ["Department name already in use"] } };

  await db.prepare("UPDATE departments SET name = ? WHERE id = ?").run(name, id);
  revalidatePath("/departments");
  redirect("/departments");
}

export async function deleteDepartment(id: number): Promise<{ error?: string } | undefined> {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { error: "Unauthorized" };

  const db = getDb();

  // Only Dept Users actually belong to a single department — IM/SIO/JIO oversee all departments and shouldn't block deletion.
  const userCount = (await db.prepare("SELECT COUNT(*) as c FROM users WHERE department_id = ? AND is_active = 1 AND role = 'DEPT_USER'").get(id) as any).c;
  const assetCount = (await db.prepare("SELECT COUNT(*) as c FROM assets WHERE department_id = ?").get(id) as any).c;

  if (userCount > 0 || assetCount > 0) {
    const parts = [];
    if (userCount > 0) parts.push(`${userCount} user${userCount !== 1 ? "s" : ""}`);
    if (assetCount > 0) parts.push(`${assetCount} asset${assetCount !== 1 ? "s" : ""}`);
    return { error: `Cannot delete — ${parts.join(" and ")} still assigned to this department. Reassign or remove them first.` };
  }

  await db.prepare("DELETE FROM departments WHERE id = ?").run(id);
  revalidatePath("/departments");
  redirect("/departments");
}
