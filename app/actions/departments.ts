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

  const existing = db.prepare("SELECT id FROM departments WHERE name = ?").get(name);
  if (existing) return { errors: { name: ["Department name already exists"] } };

  db.prepare("INSERT INTO departments (name) VALUES (?)").run(name);
  revalidatePath("/departments");
  redirect("/departments");
}

export async function updateDepartment(id: number, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { errors: { name: ["Department name is required"] } };

  const existing = db.prepare("SELECT id FROM departments WHERE name = ? AND id != ?").get(name, id);
  if (existing) return { errors: { name: ["Department name already in use"] } };

  db.prepare("UPDATE departments SET name = ? WHERE id = ?").run(name, id);
  revalidatePath("/departments");
  redirect("/departments");
}

export async function deleteDepartment(id: number) {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return;
  const db = getDb();
  db.prepare("DELETE FROM departments WHERE id = ?").run(id);
  revalidatePath("/departments");
  redirect("/departments");
}
