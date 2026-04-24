"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { ROLE_STEPS } from "@/lib/types";

// ─── Step 1: Inventory Manager Initial Check ─────────────────────────────────
// IM reviews stock, optionally links a tentative asset, forwards to JIO.
export async function processIMInitialReview(
  approvalId: number,
  decision: "Approved" | "Rejected",
  tentativeAssetId: number | null,
  notes: string
) {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { error: "Unauthorized" };

  const db = getDb();
  const approval = db.prepare(`
    SELECT a.*, r.id as req_id
    FROM approvals a JOIN requests r ON a.request_id = r.id
    WHERE a.id = ? AND a.step = 'IM Initial Review' AND a.status = 'Pending'
  `).get(approvalId) as any;

  if (!approval) return { error: "Approval step not found or already processed" };

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE approvals SET status=?, reviewer_id=?, comments=?, reviewed_at=datetime('now')
      WHERE id=?
    `).run(decision, userId, notes || null, approvalId);

    if (decision === "Rejected") {
      db.prepare("UPDATE requests SET status='Rejected', updated_at=datetime('now') WHERE id=?").run(approval.req_id);
      return;
    }

    db.prepare(`
      UPDATE requests SET status='IM Review', tentative_asset_id=?, im_notes=?, updated_at=datetime('now')
      WHERE id=?
    `).run(tentativeAssetId ?? null, notes || null, approval.req_id);

    db.prepare("INSERT INTO approvals (request_id, step) VALUES (?, 'JIO Approval')").run(approval.req_id);
  });

  tx();
  revalidatePath("/approvals");
  revalidatePath("/requests");
}

// ─── Step 2 & 3: JIO and SIO Approval ────────────────────────────────────────
export async function processApproval(
  approvalId: number,
  decision: "Approved" | "Rejected",
  comments: string
) {
  const { userId, role } = await verifySession();
  const db = getDb();

  const approval = db.prepare(`
    SELECT a.*, r.id as req_id, r.status as req_status
    FROM approvals a JOIN requests r ON a.request_id = r.id
    WHERE a.id = ? AND a.status = 'Pending'
  `).get(approvalId) as any;

  if (!approval) return { error: "Approval not found" };

  const allowedSteps = ROLE_STEPS[role] ?? [];
  if (!allowedSteps.includes(approval.step)) return { error: "Unauthorized for this step" };

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE approvals SET status=?, reviewer_id=?, comments=?, reviewed_at=datetime('now')
      WHERE id=?
    `).run(decision, userId, comments || null, approvalId);

    if (decision === "Rejected") {
      db.prepare("UPDATE requests SET status='Rejected', updated_at=datetime('now') WHERE id=?").run(approval.req_id);
      return;
    }

    if (approval.step === "JIO Approval") {
      db.prepare("UPDATE requests SET status='JIO Approved', updated_at=datetime('now') WHERE id=?").run(approval.req_id);
      db.prepare("INSERT INTO approvals (request_id, step) VALUES (?, 'SIO Approval')").run(approval.req_id);
    } else if (approval.step === "SIO Approval") {
      db.prepare("UPDATE requests SET status='SIO Approved', updated_at=datetime('now') WHERE id=?").run(approval.req_id);
      db.prepare("INSERT INTO approvals (request_id, step) VALUES (?, 'IM Final Processing')").run(approval.req_id);
    }
  });

  tx();
  revalidatePath("/approvals");
  revalidatePath("/requests");
}

// ─── Step 4: Inventory Manager Final Processing ───────────────────────────────
// IM assigns exact asset, records issuance details, sets EOL date.
export async function issueAsset(
  approvalId: number,
  assetId: number,
  assignedToName: string,
  conditionOnIssue: string,
  endOfLifeDate: string,
  acknowledged: boolean
) {
  const { userId, role } = await verifySession();
  if (role !== "INVENTORY_MANAGER") return { error: "Unauthorized" };

  const db = getDb();

  const approval = db.prepare(`
    SELECT a.*, r.id as req_id, r.department_id
    FROM approvals a JOIN requests r ON a.request_id = r.id
    WHERE a.id = ? AND a.step = 'IM Final Processing' AND a.status = 'Pending'
  `).get(approvalId) as any;

  if (!approval) return { error: "Final processing step not found or already done" };

  const asset = db.prepare("SELECT * FROM assets WHERE id = ? AND status = 'Available'").get(assetId) as any;
  if (!asset) return { error: "Asset not available" };

  const today = new Date().toISOString().split("T")[0];

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE approvals SET status='Approved', reviewer_id=?, reviewed_at=datetime('now')
      WHERE id=?
    `).run(userId, approvalId);

    db.prepare(`
      UPDATE assets
      SET status='Assigned',
          department_id=?,
          issued_date=?,
          end_of_life_date=?,
          updated_at=datetime('now')
      WHERE id=?
    `).run(approval.department_id ?? asset.department_id, today, endOfLifeDate || null, assetId);

    db.prepare(`
      UPDATE requests
      SET status='Issued',
          allocated_asset_id=?,
          allocation_date=?,
          assigned_to_name=?,
          condition_on_issue=?,
          acknowledged=?,
          updated_at=datetime('now')
      WHERE id=?
    `).run(assetId, today, assignedToName || null, conditionOnIssue || null, acknowledged ? 1 : 0, approval.req_id);
  });

  tx();
  revalidatePath("/approvals");
  revalidatePath("/requests");
  revalidatePath("/assets");
}
