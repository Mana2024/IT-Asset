"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { generateEmployeeId } from "@/lib/utils";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createUser(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const userRole = formData.get("role") as string;
  const department_id = formData.get("department_id") ? parseInt(formData.get("department_id") as string) : null;

  if (!name) return { errors: { name: ["Name is required"] } };
  if (!email) return { errors: { email: ["Email is required"] } };
  if (!password || password.length < 6) return { errors: { password: ["Password must be at least 6 characters"] } };
  if (!userRole) return { errors: { role: ["Role is required"] } };

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return { errors: { email: ["Email already in use"] } };

  const employee_id = generateEmployeeId(db);
  const password_hash = await bcrypt.hash(password, 10);

  db.prepare(`
    INSERT INTO users (employee_id, name, email, password_hash, role, department_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(employee_id, name, email, password_hash, userRole, department_id);

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(id: number, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const db = getDb();
  const name = (formData.get("name") as string)?.trim();
  const userRole = formData.get("role") as string;
  const department_id = formData.get("department_id") ? parseInt(formData.get("department_id") as string) : null;
  const is_active = formData.get("is_active") === "1" ? 1 : 0;

  if (!name) return { errors: { name: ["Name is required"] } };

  db.prepare(`
    UPDATE users SET name=?, role=?, department_id=?, is_active=?, updated_at=datetime('now')
    WHERE id=?
  `).run(name, userRole, department_id, is_active, id);

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  redirect(`/users/${id}`);
}

export async function deactivateUser(id: number) {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return;
  const db = getDb();
  db.prepare("UPDATE users SET is_active=0, updated_at=datetime('now') WHERE id=?").run(id);
  revalidatePath("/users");
}

export async function resetUserPassword(id: number, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { message: "Unauthorized" };

  const newPassword = formData.get("new_password") as string;
  if (!newPassword || newPassword.length < 6) return { errors: { new_password: ["Password must be at least 6 characters"] } };

  const db = getDb();
  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password_hash=?, updated_at=datetime('now') WHERE id=?").run(hash, id);
  return { message: "Password reset successfully" };
}

export async function updateOwnProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId } = await verifySession();
  const db = getDb();

  const designation = (formData.get("designation") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;

  db.prepare(`
    UPDATE users SET designation=?, phone=?, updated_at=datetime('now') WHERE id=?
  `).run(designation, phone, userId);

  return { message: "Profile updated successfully" };
}

export async function changeOwnPassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId } = await verifySession();

  const current = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirm = formData.get("confirm_password") as string;

  if (!current) return { errors: { current_password: ["Current password is required"] } };
  if (!newPassword || newPassword.length < 6) return { errors: { new_password: ["New password must be at least 6 characters"] } };
  if (newPassword !== confirm) return { errors: { confirm_password: ["Passwords do not match"] } };

  const db = getDb();
  const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(userId) as any;
  const valid = await bcrypt.compare(current, user.password_hash);
  if (!valid) return { errors: { current_password: ["Current password is incorrect"] } };

  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password_hash=?, updated_at=datetime('now') WHERE id=?").run(hash, userId);
  return { message: "Password changed successfully" };
}
