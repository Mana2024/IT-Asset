"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { generateRequestNumber } from "@/lib/utils";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createRequest(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId } = await verifySession();
  const db = getDb();

  const asset_type = (formData.get("asset_type") as string)?.trim();
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const justification = (formData.get("justification") as string)?.trim();
  const requester_name = (formData.get("requester_name") as string)?.trim() || null;
  const requester_employee_id = (formData.get("requester_employee_id") as string)?.trim() || null;
  const requester_email = (formData.get("requester_email") as string)?.trim() || null;
  const requester_designation = (formData.get("requester_designation") as string)?.trim() || null;
  const requester_phone = (formData.get("requester_phone") as string)?.trim() || null;
  const user = db.prepare("SELECT department_id FROM users WHERE id = ?").get(userId) as any;

  if (!asset_type) return { errors: { asset_type: ["Asset type is required"] } };
  if (!justification) return { errors: { justification: ["Justification is required"] } };
  if (!requester_name) return { errors: { requester_name: ["Worker name is required"] } };
  if (!requester_employee_id) return { errors: { requester_employee_id: ["Worker employee ID is required"] } };
  if (!requester_phone) return { errors: { requester_phone: ["Worker phone number is required"] } };

  const request_number = generateRequestNumber(db);

  const result = db.prepare(`
    INSERT INTO requests (request_number, requested_by, department_id, asset_type, quantity, justification,
                          requester_name, requester_employee_id, requester_email,
                          requester_designation, requester_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(request_number, userId, user?.department_id ?? null, asset_type, quantity, justification,
         requester_name, requester_employee_id, requester_email, requester_designation, requester_phone);

  const requestId = result.lastInsertRowid as number;

  db.prepare(`INSERT INTO approvals (request_id, step) VALUES (?, 'IM Initial Review')`).run(requestId);

  revalidatePath("/requests");
  redirect("/requests");
}

export async function createServiceRequest(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId } = await verifySession();
  const db = getDb();

  const request_type = formData.get("request_type") as string;
  const service_asset_id = parseInt(formData.get("service_asset_id") as string);
  const service_reason = (formData.get("service_reason") as string)?.trim();
  const requester_name = (formData.get("requester_name") as string)?.trim() || null;
  const requester_employee_id = (formData.get("requester_employee_id") as string)?.trim() || null;
  const requester_phone = (formData.get("requester_phone") as string)?.trim() || null;

  if (!request_type || !["Return", "Repair"].includes(request_type))
    return { errors: { request_type: ["Invalid request type"] } };
  if (!service_asset_id) return { errors: { service_asset_id: ["Please select an asset"] } };
  if (!service_reason) return { errors: { service_reason: ["Reason is required"] } };
  if (!requester_name) return { errors: { requester_name: ["Worker name is required"] } };
  if (!requester_phone) return { errors: { requester_phone: ["Phone number is required"] } };

  const asset = db.prepare("SELECT * FROM assets WHERE id = ? AND status = 'Assigned'").get(service_asset_id) as any;
  if (!asset) return { errors: { service_asset_id: ["Asset not found or not currently assigned"] } };

  const user = db.prepare("SELECT department_id FROM users WHERE id = ?").get(userId) as any;
  const request_number = generateRequestNumber(db);

  const result = db.prepare(`
    INSERT INTO requests (request_number, requested_by, department_id, request_type,
                          asset_type, justification,
                          service_asset_id, service_reason,
                          requester_name, requester_employee_id, requester_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(request_number, userId, user?.department_id ?? null, request_type,
         asset.asset_type, service_reason,
         service_asset_id, service_reason,
         requester_name, requester_employee_id, requester_phone);

  const requestId = result.lastInsertRowid as number;
  db.prepare(`INSERT INTO approvals (request_id, step) VALUES (?, 'IM Service Processing')`).run(requestId);

  revalidatePath("/requests");
  redirect("/requests");
}

export async function processServiceRequest(
  approvalId: number,
  decision: "Approved" | "Rejected",
  comments: string
) {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { error: "Unauthorized" };

  const db = getDb();
  const approval = db.prepare(`
    SELECT a.*, r.id as req_id, r.request_type, r.service_asset_id
    FROM approvals a JOIN requests r ON a.request_id = r.id
    WHERE a.id = ? AND a.step = 'IM Service Processing' AND a.status = 'Pending'
  `).get(approvalId) as any;

  if (!approval) return { error: "Not found or already processed" };

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE approvals SET status=?, reviewer_id=?, comments=?, reviewed_at=datetime('now')
      WHERE id=?
    `).run(decision, userId, comments || null, approvalId);

    if (decision === "Rejected") {
      db.prepare("UPDATE requests SET status='Rejected', updated_at=datetime('now') WHERE id=?").run(approval.req_id);
      return;
    }

    if (approval.request_type === "Return") {
      db.prepare("UPDATE assets SET status='Available', department_id=NULL, issued_date=NULL, end_of_life_date=NULL, updated_at=datetime('now') WHERE id=?").run(approval.service_asset_id);
      db.prepare("UPDATE requests SET status='Returned', updated_at=datetime('now') WHERE id=?").run(approval.req_id);
    } else if (approval.request_type === "Repair") {
      db.prepare("UPDATE assets SET status='Maintenance', updated_at=datetime('now') WHERE id=?").run(approval.service_asset_id);
      db.prepare("UPDATE requests SET status='Under Repair', updated_at=datetime('now') WHERE id=?").run(approval.req_id);
    }
  });

  tx();
  revalidatePath("/approvals");
  revalidatePath("/requests");
  revalidatePath("/assets");
}

export async function createExternalIssuanceRequest(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { errors: { _: ["Unauthorized"] } };

  const db = getDb();
  const issue_to_type = (formData.get("issue_to_type") as string)?.trim();
  const issue_to_org_name = (formData.get("issue_to_org_name") as string)?.trim();
  const asset_type = (formData.get("asset_type") as string)?.trim();
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const justification = (formData.get("justification") as string)?.trim();
  const contact_person = (formData.get("contact_person") as string)?.trim() || null;
  const contact_phone = (formData.get("contact_phone") as string)?.trim() || null;

  if (!issue_to_type || !["NGO", "School"].includes(issue_to_type))
    return { errors: { issue_to_type: ["Please select NGO or School"] } };
  if (!issue_to_org_name) return { errors: { issue_to_org_name: ["Organisation name is required"] } };
  if (!asset_type) return { errors: { asset_type: ["Asset type is required"] } };
  if (!justification) return { errors: { justification: ["Purpose / justification is required"] } };

  const request_number = generateRequestNumber(db);

  const result = db.prepare(`
    INSERT INTO requests (request_number, requested_by, request_type, asset_type, quantity, justification,
                          issue_to_type, issue_to_org_name,
                          requester_name, requester_phone,
                          status)
    VALUES (?, ?, 'External Issuance', ?, ?, ?, ?, ?, ?, ?, 'IM Review')
  `).run(request_number, userId, asset_type, quantity, justification,
         issue_to_type, issue_to_org_name,
         contact_person, contact_phone);

  const requestId = result.lastInsertRowid as number;
  db.prepare(`INSERT INTO approvals (request_id, step) VALUES (?, 'JIO Approval')`).run(requestId);

  revalidatePath("/requests");
  redirect("/requests");
}

export async function cancelRequest(id: number) {
  const { userId } = await verifySession();
  const db = getDb();
  const req = db.prepare("SELECT * FROM requests WHERE id = ?").get(id) as any;
  if (!req || req.requested_by !== userId) return;
  if (req.status !== "Pending") return;
  db.prepare("UPDATE requests SET status = 'Rejected', updated_at = datetime('now') WHERE id = ?").run(id);
  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
}
