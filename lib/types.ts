export type UserRole = "INVENTORY_MANAGER" | "SIO" | "JIO" | "DEPT_USER";

export type AssetStatus = "Available" | "Assigned" | "Maintenance";

export type RequestType = "New Asset" | "Return" | "Repair" | "External Issuance";

export type RequestStatus =
  | "Pending"
  | "IM Review"
  | "JIO Approved"
  | "SIO Approved"
  | "Issued"
  | "Rejected"
  | "Returned"
  | "Under Repair";

export type ApprovalStep =
  | "IM Initial Review"
  | "JIO Approval"
  | "SIO Approval"
  | "IM Final Processing"
  | "IM Service Processing";

export interface Department {
  id: number;
  name: string;
  created_at: string;
}

export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id: number | null;
  department_name?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: number;
  asset_id: string;
  asset_type: string;
  serial_number: string | null;
  description: string | null;
  status: AssetStatus;
  department_id: number | null;
  department_name?: string | null;
  issued_date: string | null;
  end_of_life_date: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AssetRequest {
  id: number;
  request_number: string;
  requested_by: number;
  requested_by_name?: string;
  department_id: number | null;
  department_name?: string | null;
  asset_type: string;
  quantity: number;
  justification: string;
  status: RequestStatus;
  tentative_asset_id: number | null;
  im_notes: string | null;
  allocated_asset_id: number | null;
  allocation_date: string | null;
  assigned_to_name: string | null;
  condition_on_issue: string | null;
  acknowledged: number;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: number;
  request_id: number;
  step: ApprovalStep;
  status: "Pending" | "Approved" | "Rejected";
  reviewer_id: number | null;
  reviewer_name?: string | null;
  comments: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  INVENTORY_MANAGER: "Inventory Manager",
  SIO: "SIO (Senior Inspection Officer)",
  JIO: "JIO (Junior Inspection Officer)",
  DEPT_USER: "Department User",
};

// Maps each role to the approval steps they are responsible for
export const ROLE_STEPS: Record<string, ApprovalStep[]> = {
  INVENTORY_MANAGER: ["IM Initial Review", "IM Final Processing", "IM Service Processing"],
  JIO: ["JIO Approval"],
  SIO: ["SIO Approval"],
};

export const ASSET_TYPES = [
  "Laptop",
  "Desktop",
  "Workstation",
  "Server",
  "Router",
  "Hub",
  "Switch",
  "Printer",
  "Scanner",
  "Monitor",
  "UPS",
  "Projector",
  "Phone",
  "Tablet",
  "Other",
];
