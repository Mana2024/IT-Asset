import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  TableLayoutType, VerticalAlign, ShadingType, PageBreak,
  LevelFormat, convertInchesToTwip, UnderlineType, PageOrientation,
  Header, Footer, PageNumberElement, NumberFormat
} from "docx";
import { writeFileSync } from "fs";

// ─── helpers ────────────────────────────────────────────────────────────────

const BLUE   = "1F3864";
const LTBLUE = "D6E4F7";
const GRAY   = "F2F2F2";
const WHITE  = "FFFFFF";
const BLACK  = "000000";

const noBorder = {
  top:    { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left:   { style: BorderStyle.NONE, size: 0 },
  right:  { style: BorderStyle.NONE, size: 0 },
};

const thinBorder = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
  left:   { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
  right:  { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
};

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    thematicBreak: false,
    run: { color: BLUE, bold: true },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, color: BLACK, ...opts })],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { type: ShadingType.CLEAR, fill: GRAY },
    children: [new TextRun({ text, font: "Courier New", size: 18 })],
  });
}

function blankLine() {
  return new Paragraph({ text: "", spacing: { before: 60, after: 60 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// header row + data rows table
function buildTable(headers, rows, colWidths) {
  const pct = WidthType.PERCENTAGE;

  const headerCells = headers.map((h, i) =>
    new TableCell({
      shading: { type: ShadingType.CLEAR, fill: BLUE },
      borders: thinBorder,
      width: { size: colWidths[i], type: pct },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: h, bold: true, color: WHITE, size: 20 })],
      })],
    })
  );

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? WHITE : LTBLUE },
          borders: thinBorder,
          width: { size: colWidths[ci], type: pct },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text: String(cell), size: 20 })],
          })],
        })
      ),
    })
  );

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: pct },
    rows: [
      new TableRow({ tableHeader: true, children: headerCells }),
      ...dataRows,
    ],
  });
}

// ─── document ───────────────────────────────────────────────────────────────

const children = [

  // ── Title page ──────────────────────────────────────────────────────────
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1200, after: 200 },
    children: [new TextRun({ text: "SOFTWARE REQUIREMENTS SPECIFICATION", bold: true, size: 52, color: BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
    children: [new TextRun({ text: "for", size: 28, color: "555555" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 400 },
    children: [new TextRun({ text: "IT-Asset — Centralized IT Asset Management System", bold: true, size: 36, color: BLUE })],
  }),
  buildTable(
    ["Field", "Details"],
    [
      ["Version",        "1.0 Approved"],
      ["Prepared by",    "IT-Asset Development Team"],
      ["Organization",   "NIT Meghalaya"],
      ["Date",           "April 24, 2026"],
    ],
    [30, 70]
  ),
  blankLine(),
  blankLine(),

  // Revision history
  h2("Revision History"),
  buildTable(
    ["Name", "Date", "Reason For Changes", "Version"],
    [
      ["Initial Draft",    "April 2026",    "First complete SRS",                                                                 "1.0"],
      ["Policy Alignment", "April 30, 2026","Corrected ICT category assignments; added On Hold workflow; updated e-waste disposal process", "1.1"],
    ],
    [20, 20, 45, 15]
  ),
  pageBreak(),

  // ── 1. Introduction ─────────────────────────────────────────────────────
  h1("1. Introduction"),

  h2("1.1 Purpose"),
  para("This document specifies the software requirements for IT-Asset, a centralized web-based IT Asset Management System (version 1.0). It describes functional and non-functional requirements, data model, approval workflows, and system interfaces for developers, testers, quality assurance teams, and organizational stakeholders."),
  para("The scope covers the full lifecycle of IT asset management — from procurement and requisition through multi-level approval, issuance, in-service management, and end-of-life e-waste disposal."),

  h2("1.2 Document Conventions"),
  bullet("Requirement identifiers follow the pattern <AREA>-<NN> (e.g., FR-AUTH-01, NFR-01)."),
  bullet("Bold text denotes key terms defined in the Glossary (Section 6.1)."),
  bullet("Priority levels: High (must have for launch), Medium (important but deferrable), Low (nice to have)."),
  bullet("Role names in SMALL CAPS when referring to system roles: INVENTORY_MANAGER, SIO, JIO, DEPT_USER."),

  h2("1.3 Intended Audience and Reading Suggestions"),
  buildTable(
    ["Reader", "Relevant Sections"],
    [
      ["Developers",            "All sections, especially §3, §4, §6.2"],
      ["Testers / QA",          "§4 (System Features), §5 (NFRs), §6.3 (TBD list)"],
      ["Project Managers",      "§1, §2, §5"],
      ["End Users / Admins",    "§2, §4"],
      ["Database Architects",   "§6.2 (ER Diagram and Schema)"],
      ["Security Auditors",     "§5.2, §5.3"],
    ],
    [40, 60]
  ),

  h2("1.4 Project Scope"),
  para("IT-Asset is a full-stack web application for managing an organization's IT asset inventory. Its primary goals are:"),
  bullet("Maintain a complete, auditable registry of IT equipment (laptops, desktops, servers, printers, networking devices, etc.)"),
  bullet("Process asset requisitions through a structured 4-step approval workflow (IM → JIO → SIO → IM Issuance)"),
  bullet("Track every asset from procurement through assignment to internal workers or external NGOs / educational institutions to eventual e-waste disposal"),
  bullet("Enforce role-based access control ensuring each actor can only perform actions appropriate to their authority level"),
  bullet("Generate printable inventory, requisition, and e-waste disposal reports for audit compliance"),
  para("IT-Asset does not cover procurement budgeting, vendor management, financial accounting, or HR management. Integration with external ERP systems is out of scope for version 1.0."),

  h2("1.5 References"),
  buildTable(
    ["#", "Reference"],
    [
      ["1", "IEEE Std 830-1998 — IEEE Recommended Practice for Software Requirements Specifications"],
      ["2", "Next.js App Router Documentation — node_modules/next/dist/docs/"],
      ["3", "better-sqlite3 API Documentation — v12.9.0"],
      ["4", "jose JWT Library Documentation — v6.2.2"],
      ["5", "OWASP Top 10 Security Risks (2021)"],
      ["6", "Organization IT Asset Policy — ICT Category Lifespan Guidelines"],
    ],
    [8, 92]
  ),
  pageBreak(),

  // ── 2. Overall Description ───────────────────────────────────────────────
  h1("2. Overall Description"),

  h2("2.1 Product Perspective"),
  para("IT-Asset is a standalone, self-contained full-stack web application. It is not a module within a larger enterprise system; it replaces existing manual or spreadsheet-based asset tracking processes."),
  para("The system uses a server-side SQLite database (single-file, embedded) for all persistent storage, JWT-based session management via HttpOnly cookies, and a React server-component frontend (Next.js App Router) where all business logic runs exclusively on the server. A REST API layer supports programmatic access alongside server actions for form submissions."),

  h2("2.2 Product Functions"),
  para("High-level functions the product must perform:"),
  bullet("Asset Registry Management — Create, view, edit, and search assets; track status, serial number, ICT category, EOL date"),
  bullet("Requisition Submission — Department users submit requests for new assets (for workers or external organisations)"),
  bullet("4-Step Approval Workflow — Sequential IM → JIO → SIO → IM issuance pipeline with full audit trail"),
  bullet("Asset Issuance — Inventory Manager issues approved assets to workers or NGOs/educational institutions"),
  bullet("Return and Repair Processing — Department users request returns or repairs; IM processes and updates asset status"),
  bullet("E-Waste Disposal — IM initiates formal disposal for EOL assets; system maintains an immutable disposal log"),
  bullet("User and Department Administration — IM manages system accounts, roles, departments, and employee records"),
  bullet("EOL Alerting — Dashboard alerts IM when assets approach or pass their end-of-life date"),
  bullet("Reporting and Printing — Generate and print inventory, requisition, and e-waste reports"),

  h2("2.3 User Classes and Characteristics"),
  buildTable(
    ["Role", "Technical Level", "Frequency", "Access Scope"],
    [
      ["INVENTORY_MANAGER",  "Moderate",  "Daily, heavy use",          "Full system access"],
      ["SIO",                "Moderate",  "Weekly — approvals only",   "Approval queue, asset/request views"],
      ["JIO",                "Moderate",  "Weekly — approvals only",   "Approval queue, asset/request views"],
      ["DEPT_USER",          "Basic",     "As needed — per requisition","Own department's requests, employee lookup"],
    ],
    [22, 22, 28, 28]
  ),

  h2("2.4 Operating Environment"),
  buildTable(
    ["Component", "Specification"],
    [
      ["Server OS",    "Linux / macOS / Windows (Node.js compatible)"],
      ["Runtime",      "Node.js (LTS)"],
      ["Database",     "SQLite — single .db file on the server filesystem"],
      ["Client",       "Any modern web browser (Chrome 110+, Firefox 110+, Safari 16+, Edge 110+)"],
      ["Network",      "Internal LAN or VPN-protected intranet; HTTPS required for production"],
      ["Memory",       "Minimum 512 MB RAM for the Node.js process"],
      ["Storage",      "Minimum 1 GB for the database file and application"],
    ],
    [30, 70]
  ),

  h2("2.5 Design and Implementation Constraints"),
  bullet("SQLite only: The database engine is fixed as better-sqlite3. Horizontal scaling not supported without switching to a client-server database."),
  bullet("Server-side rendering: All sensitive data queries must run in server components or server actions."),
  bullet("No external auth provider: Authentication is password-based with bcrypt. OAuth/SAML/LDAP is out of scope."),
  bullet("Single-tenant: The application serves a single organization."),
  bullet("TypeScript strict mode: All code must compile with zero TypeScript errors."),
  bullet("ICT Category lifespan policy: Category I — 1 yr (consumables / use-and-throw), II — 5 yr, III — 7 yr, IV — 10 yr."),

  h2("2.6 User Documentation"),
  buildTable(
    ["Document", "Format", "Audience"],
    [
      ["Admin Setup Guide",   "Markdown (README.md)",    "System administrator"],
      ["SRS Document",        "Markdown / DOCX",          "All stakeholders"],
      ["In-app tooltips",     "Inline UI text",           "All end users"],
    ],
    [35, 35, 30]
  ),

  h2("2.7 Assumptions and Dependencies"),
  para("Assumptions:"),
  bullet("Each user belongs to exactly one department."),
  bullet("Only one INVENTORY_MANAGER operates the system at a time in production (single-writer assumption)."),
  bullet("Assets are physical IT equipment — software licenses and consumables are not tracked."),
  bullet("External organisations (NGOs, schools) are pre-vetted before a DEPT_USER references them."),
  para("Key Dependencies:"),
  buildTable(
    ["Package", "Version", "Purpose"],
    [
      ["better-sqlite3",  "^12.9.0", "Synchronous SQLite driver"],
      ["jose",            "^6.2.2",  "JWT signing and verification"],
      ["bcryptjs",        "^3.0.3",  "Password hashing"],
      ["next",            "16.2.4",  "Full-stack React framework"],
      ["lucide-react",    "^1.8.0",  "Icon library"],
      ["docx",            "^9.6.1",  "Server-side document generation"],
    ],
    [30, 20, 50]
  ),
  pageBreak(),

  // ── 3. External Interface Requirements ──────────────────────────────────
  h1("3. External Interface Requirements"),

  h2("3.1 User Interfaces"),
  bullet("All pages use a consistent shell layout: left sidebar (role-based navigation) + top navigation bar (user info, logout)."),
  bullet("Authentication: /login — email + password form."),
  bullet("Dashboard: /dashboard — KPI stat cards. IM additionally sees an EOL Alert panel."),
  bullet("Asset List: /assets — filterable table (status, type, department) with full-text search."),
  bullet("Request Form: /requests/new — multi-step form; recipient type selector (Worker / NGO / Education) controls which field set is shown."),
  bullet("Approval Detail: /approvals/[id] — approval timeline showing each step's reviewer, decision, comments, and timestamp."),
  bullet("Print Views: /print/requests — print-optimized layout that auto-triggers the browser print dialog on load."),
  bullet("Forms provide inline client-side validation before submission; server-side errors are displayed adjacent to the offending field."),

  h2("3.2 Hardware Interfaces"),
  para("IT-Asset does not directly interface with any hardware devices. It is a pure web application. Physical asset data (serial numbers, model information) is entered manually by the INVENTORY_MANAGER."),

  h2("3.3 Software Interfaces"),
  buildTable(
    ["Interface", "Version", "Purpose"],
    [
      ["SQLite (better-sqlite3)", "^12.9.0", "Primary data store — synchronous, embedded"],
      ["Node.js File System",     "—",        "SQLite .db file read/write"],
      ["Browser Cookie API",      "—",        "HttpOnly session JWT cookie storage"],
      ["jose",                    "^6.2.2",   "JWT sign (SignJWT) and verify (jwtVerify)"],
      ["bcryptjs",                "^3.0.3",   "Password hash comparison and generation"],
      ["Next.js Server Actions",  "16.2.4",   "Form submission handlers running on the server"],
      ["docx",                    "^9.6.1",   "Generating .docx report exports"],
    ],
    [30, 15, 55]
  ),

  h2("3.4 Communications Interfaces"),
  bullet("HTTP/HTTPS is the sole communication protocol. HTTPS required in production via reverse proxy."),
  bullet("REST API endpoints under /api/ return JSON. All endpoints require a valid session cookie; unauthenticated requests receive 401 Unauthorized."),
  bullet("Session Cookie: Name 'session', HttpOnly, SameSite=Strict, Secure in production. JWT payload contains userId, role, name."),
  bullet("No WebSocket or real-time push — notifications are visible only on next page load."),
  bullet("No email integration — no SMTP or transactional email is sent in version 1.0."),
  pageBreak(),

  // ── 4. System Features ──────────────────────────────────────────────────
  h1("4. System Features"),

  // 4.1
  h2("4.1 Authentication and Session Management"),
  h3("4.1.1 Description and Priority"),
  para("Priority: High. Provides secure login/logout and session persistence. All dashboard routes are protected; without authentication no other feature is accessible."),
  h3("4.1.2 Stimulus/Response Sequences"),
  buildTable(
    ["Stimulus", "Response"],
    [
      ["User navigates to /dashboard/* without a session cookie",        "Redirect to /login"],
      ["User submits valid email and password",                          "Verify bcrypt; sign JWT; set HttpOnly cookie; redirect to /dashboard"],
      ["User submits invalid credentials",                               "Display error: 'Invalid email or password'"],
      ["Valid session but role not permitted for the route",             "Redirect to /login (403)"],
      ["User clicks Logout",                                             "Clear session cookie; redirect to /login"],
      ["User submits Change Password with correct current password",     "Hash new password; update users.password_hash"],
    ],
    [50, 50]
  ),
  h3("4.1.3 Functional Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["FR-AUTH-01", "Users log in using their registered email address and password."],
      ["FR-AUTH-02", "Passwords are verified against a bcrypt hash (cost factor 10)."],
      ["FR-AUTH-03", "On successful login, a signed JWT is stored as an HttpOnly cookie named 'session'."],
      ["FR-AUTH-04", "Every dashboard route verifies the session cookie server-side before rendering."],
      ["FR-AUTH-05", "Deactivated users (is_active = 0) cannot log in."],
      ["FR-AUTH-06", "Users can change their own password by providing the current password."],
      ["FR-AUTH-07", "INVENTORY_MANAGER can reset any user's password without knowing the current one."],
    ],
    [18, 82]
  ),

  // 4.2
  h2("4.2 Asset Registry Management"),
  h3("4.2.1 Description and Priority"),
  para("Priority: High. The core inventory registry. Only INVENTORY_MANAGER can create, modify, or delete records. All roles can view assets."),
  h3("4.2.2 Stimulus/Response Sequences"),
  buildTable(
    ["Stimulus", "Response"],
    [
      ["IM submits Add Asset form",                        "Validate; auto-generate asset_id (AST-YYYY-NNNN); insert into assets; log Created in asset_history"],
      ["IM submits bulk asset creation",                   "Create N records in a single SQLite transaction with sequential asset IDs"],
      ["IM edits and saves an asset",                      "Validate; update assets; log Updated in asset_history"],
      ["IM deletes asset with status ≠ Available",         "Return error: 'Only Available assets can be deleted'"],
      ["Any user visits /assets",                          "Return paginated list with active filters applied"],
      ["Dashboard loads with IM session",                  "Include EOL Alert panel for assets WHERE end_of_life_date <= today"],
    ],
    [45, 55]
  ),
  h3("4.2.3 Functional Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["FR-ASSET-01", "Only INVENTORY_MANAGER can create, edit, and delete asset records."],
      ["FR-ASSET-02", "Each asset has a unique system-generated asset_id: AST-YYYY-NNNN."],
      ["FR-ASSET-03", "Serial numbers, when provided, must be globally unique."],
      ["FR-ASSET-04", "Valid statuses: Available, Assigned, Maintenance, Returned, Condemned, Disposed."],
      ["FR-ASSET-05", "Only Available assets can be deleted."],
      ["FR-ASSET-06", "Assets store: type, serial number, description, department, ICT category, issued date, EOL date, creator, timestamps."],
      ["FR-ASSET-07", "Asset type must be one of the 36 predefined types across four ICT categories."],
      ["FR-ASSET-08", "Asset list supports filtering by status, type, department, and full-text search."],
      ["FR-ASSET-09", "All asset mutations are recorded in asset_history with event type, actor, role, and timestamp."],
      ["FR-ASSET-10", "IM dashboard shows EOL Alert panel for all assets where end_of_life_date <= current date."],
      ["FR-ASSET-11", "A printable inventory report can be generated from the asset list."],
      ["FR-ASSET-12", "ICT lifespans: Category I — 1 yr (consumables), Category II — 5 yr, Category III — 7 yr, Category IV — 10 yr."],
      ["FR-ASSET-13", "Condemnation requires a data-sanitization checklist (all items confirmed) and IM + JIO + SIO approval before the asset transitions to Condemned status."],
    ],
    [18, 82]
  ),
  blankLine(),
  para("ICT Category Asset Type Reference:", { bold: true }),
  buildTable(
    ["Category", "Lifespan", "Asset Types"],
    [
      ["I",   "1 yr",  "Printing Consumables, Storage Media, UPS Battery Pack"],
      ["II",  "5 yr",  "Laptop, Tablet, Mobile Phone, Pen Drive, External Storage"],
      ["III", "7 yr",  "Server, Mainframe, Desktop, Workstation, Monitor, Keyboard/Mouse, Storage Device, Printers, Scanner, MFD, Projector, UPS, Inverter, GPS, VC Equipment, Kiosk, Camera, Router, Switch, Hub, Modem, Firewall, NAS"],
      ["IV",  "10 yr", "LED TV, FAX Machine, EPABX, Biometric/Attendance, DVD Player"],
    ],
    [12, 12, 76]
  ),

  // 4.3
  h2("4.3 Asset Requisition Submission"),
  h3("4.3.1 Description and Priority"),
  para("Priority: High. Allows DEPT_USER to submit formal requisitions for new assets for internal workers or external NGO/educational institutions."),
  h3("4.3.2 Stimulus/Response Sequences"),
  buildTable(
    ["Stimulus", "Response"],
    [
      ["DEPT_USER selects recipient type = WORKER",         "Show worker-specific fields (employee ID, name, designation, phone, email)"],
      ["DEPT_USER selects recipient type = NGO/EDUCATION",  "Show org fields (name, registration no., contact, purpose, loan/donation toggle)"],
      ["DEPT_USER submits the form",                        "Validate; generate REQ-YYYY-NNNN; insert requests row; create IM Initial Review step; status = Pending"],
      ["DEPT_USER cancels a Pending request",               "Set request.status = Cancelled; remove pending approval step"],
      ["DEPT_USER cancels a non-Pending request",           "Return error: 'Request cannot be cancelled at this stage'"],
    ],
    [45, 55]
  ),
  h3("4.3.3 Functional Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["FR-REQ-01", "Only DEPT_USER can submit new asset requisitions."],
      ["FR-REQ-02", "DEPT_USER must select recipient type: WORKER, NGO, or EDUCATION."],
      ["FR-REQ-03", "Worker requisition captures: name, employee ID, email, phone, designation, department, asset type, quantity, justification."],
      ["FR-REQ-04", "NGO/Education requisition captures: org name, registration no., contact person, email, phone, purpose, assignment type (loan/donation), justification."],
      ["FR-REQ-05", "On submission, request number REQ-YYYY-NNNN is generated; IM Initial Review step created with status Pending."],
      ["FR-REQ-06", "DEPT_USER can cancel a request only while status is Pending."],
      ["FR-REQ-07", "Requisition list shows: request number, recipient type, name, department, asset type, quantity, status, and date."],
      ["FR-REQ-08", "DEPT_USER sees only their own department's requests. IM/JIO/SIO see all."],
      ["FR-REQ-09", "A printable requisition report can be generated for any request."],
    ],
    [18, 82]
  ),

  // 4.4
  h2("4.4 Approval Workflow — New Asset (4-Step)"),
  h3("4.4.1 Description and Priority"),
  para("Priority: High. Sequential 4-step pipeline. Each step must be completed before the next is created. Any rejection terminates the workflow immediately."),
  h3("4.4.2 Approval Step Summary"),
  buildTable(
    ["Step", "Actor", "Action on Approve", "Action on Reject / Hold"],
    [
      ["Step 1 — IM Initial Review",    "INVENTORY_MANAGER", "Create JIO Approval step; status = IM Review",           "Reject → status = Rejected; workflow ends. On Hold → status = On Hold; approval step stays Pending; IM can resume later."],
      ["Step 2 — JIO Approval",         "JIO",               "Create SIO Approval step; status = JIO Approved",         "status = Rejected (comments required); workflow ends"],
      ["Step 3 — SIO Approval",         "SIO",               "Create IM Final Processing step; status = SIO Approved",  "status = Rejected (comments required); workflow ends"],
      ["Step 4 — IM Final Processing",  "INVENTORY_MANAGER", "asset.status = Assigned; request.status = Issued",        "N/A — issuance form has no reject path"],
    ],
    [25, 20, 28, 27]
  ),
  h3("4.4.3 Functional Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["FR-APPR-01", "Step 1: IM optionally links a tentative asset, records notes, then forwards to JIO or rejects."],
      ["FR-APPR-02", "Step 2: JIO reviews request and IM notes, writes comments, then approves (to SIO) or rejects. Comments mandatory on rejection."],
      ["FR-APPR-03", "Step 3: SIO reviews full trail, writes comments, then approves (to IM Final Processing) or rejects. Comments mandatory on rejection."],
      ["FR-APPR-04", "Step 4: IM selects exact asset (serial number confirmed), records recipient type, details, condition, EOL date, acknowledgement, then issues."],
      ["FR-APPR-05", "Rejection at any step immediately sets request.status = Rejected. No further steps are created."],
      ["FR-APPR-06", "On issuance: asset.status = Assigned; asset.issued_date = today; asset.end_of_life_date set per policy; request.status = Issued."],
      ["FR-APPR-07", "Each approval row records reviewer ID, decision, comments, and reviewed_at timestamp."],
      ["FR-APPR-08", "The approval timeline is visible to all roles who can view the request."],
      ["FR-APPR-09", "A role can act only on the approval step assigned to it; all other steps are read-only."],
      ["FR-APPR-10", "Step 1 On Hold: IM may place a request On Hold when no suitable asset is currently available. The Step 1 approval record remains Pending; request.status is set to On Hold. IM can return and forward to JIO or reject at any time."],
    ],
    [18, 82]
  ),

  // 4.5
  h2("4.5 Return and Repair Workflow"),
  h3("4.5.1 Description and Priority"),
  para("Priority: High. Allows DEPT_USER to request the return or repair of an assigned asset. IM processes the request in a single approval step."),
  h3("4.5.2 Functional Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["FR-SVC-01", "DEPT_USER can submit a Return or Repair request for any currently Assigned asset."],
      ["FR-SVC-02", "Repair requests are blocked for assets that were permanently donated to an NGO or educational institution."],
      ["FR-SVC-03", "Service request form captures: type (Return/Repair), asset selection, worker/org details, and reason."],
      ["FR-SVC-04", "On submission, an IM Service Processing approval step is created."],
      ["FR-SVC-05", "IM approves or rejects with optional comments."],
      ["FR-SVC-06", "On Return approval: asset.status = Available; issued_date and end_of_life_date cleared; request.status = Returned."],
      ["FR-SVC-07", "On Repair approval: asset.status = Maintenance; request.status = Under Repair."],
      ["FR-SVC-08", "When repair is complete, IM manually updates asset status back to Available."],
    ],
    [18, 82]
  ),

  // 4.6
  h2("4.6 E-Waste Management"),
  h3("4.6.1 Description and Priority"),
  para("Priority: High. A two-step workflow for formally decommissioning IT assets. Step A: INVENTORY_MANAGER raises a Condemnation Request (subject to JIO→SIO approval); the asset transitions to Condemned. Step B: IM records the physical disposal method (GeM Auction, Open Tender, MSTC e-Auction, or CPCB/SPCB-registered recycler), transitioning the asset to Disposed."),
  h3("4.6.2 Stimulus/Response Sequences"),
  buildTable(
    ["Stimulus", "Response"],
    [
      ["Asset's end_of_life_date <= today",                              "Asset appears in IM dashboard EOL Alert panel"],
      ["IM clicks 'Condemn Asset' on asset detail page",                 "Navigate to condemnation form: data-sanitization checklist, reason, and justification"],
      ["IM submits form with incomplete data-sanitization checklist",     "Block submission; display validation error: 'All checklist items must be completed'"],
      ["IM submits complete condemnation request",                        "Create Condemnation Request; send to JIO→SIO approval pipeline; asset remains active during review"],
      ["JIO and SIO both approve condemnation request",                   "asset.status = Condemned; asset appears in Condemned inventory; condemnation logged in asset_history"],
      ["IM clicks 'Record Disposal' on Condemned asset",                  "Show disposal form: method (GeM Auction / Open Tender / MSTC / CPCB recycler), recycler name, tender/reference no., disposal date"],
      ["IM submits disposal form",                                        "asset.status = Disposed; disposal fields saved; Disposed event logged in asset_history; asset removed from active views"],
    ],
    [45, 55]
  ),
  h3("4.6.3 Functional Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["FR-EW-01", "Only INVENTORY_MANAGER can initiate an asset condemnation request."],
      ["FR-EW-02", "Before submitting, IM must complete a 7-item Data Sanitization Checklist (backup verified, data wiped, OS/licenses deactivated, domain/network removed, credentials cleared, label removed). All items mandatory."],
      ["FR-EW-03", "IM must select a condemnation reason and provide a written justification."],
      ["FR-EW-04", "The condemnation request follows the JIO → SIO approval chain. Both must approve before the asset is condemned."],
      ["FR-EW-05", "On condemnation approval: asset.status = Condemned; event logged in asset_history."],
      ["FR-EW-06", "Once Condemned, IM records final disposal: method (GeM Auction, Open Tender, e-Auction via MSTC, or Authorised e-Waste Recycler), recycler/auction house name, tender/reference number, and disposal date."],
      ["FR-EW-07", "Disposal method is mandatory; recycler name, reference number, and date are optional."],
      ["FR-EW-08", "On disposal record submission: asset.status = Disposed; disposal fields persisted; Disposed event logged in asset_history."],
      ["FR-EW-09", "Disposed assets are excluded from all active inventory views; their detail page still shows full disposal metadata."],
      ["FR-EW-10", "A printable E-Waste Disposal Report can be generated, filterable by date range and disposal method."],
    ],
    [18, 82]
  ),

  // 4.7
  h2("4.7 User and Department Administration"),
  h3("4.7.1 Description and Priority"),
  para("Priority: High. INVENTORY_MANAGER manages system users, departments, and employee directory records."),
  h3("4.7.2 Functional Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["FR-USER-01", "Only INVENTORY_MANAGER can create, edit, and deactivate user accounts."],
      ["FR-USER-02", "User accounts require: name, email (unique), role, department, password."],
      ["FR-USER-03", "Employee IDs are auto-generated: EMP-NNN."],
      ["FR-USER-04", "Deactivated users (is_active = 0) cannot log in."],
      ["FR-USER-05", "INVENTORY_MANAGER can reset any user's password."],
      ["FR-USER-06", "Valid roles: INVENTORY_MANAGER, SIO, JIO, DEPT_USER."],
      ["FR-DEPT-01", "Only INVENTORY_MANAGER can create, edit, and delete departments."],
      ["FR-DEPT-02", "A department cannot be deleted if it has associated users or assets."],
      ["FR-EMP-01",  "INVENTORY_MANAGER can create, edit, and delete employee directory records."],
      ["FR-EMP-02",  "Employee records store: name, employee ID, email, phone, designation, and department."],
    ],
    [18, 82]
  ),

  // 4.8
  h2("4.8 Reporting and Print"),
  h3("4.8.1 Description and Priority"),
  para("Priority: Medium. Generates printable reports for inventory, requisitions, and e-waste disposal for audit and management purposes."),
  h3("4.8.2 Functional Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["FR-RPT-01", "A printable inventory report lists all assets with status, type, serial number, department, and EOL date."],
      ["FR-RPT-02", "A printable requisition report is available for individual requests."],
      ["FR-RPT-03", "A printable E-Waste Disposal Report is available, filterable by date range and disposal method."],
      ["FR-RPT-04", "Print views auto-trigger the browser's native print dialog on load."],
      ["FR-RPT-05", "All roles can access print views for records they are permitted to view."],
    ],
    [18, 82]
  ),
  pageBreak(),

  // ── 5. Non-Functional Requirements ──────────────────────────────────────
  h1("5. Other Nonfunctional Requirements"),

  h2("5.1 Performance Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["NFR-PERF-01", "SQLite runs in WAL (Write-Ahead Logging) mode to allow concurrent reads without blocking writes."],
      ["NFR-PERF-02", "Asset list queries must return results in under 500 ms for up to 10,000 records."],
      ["NFR-PERF-03", "Dashboard KPI counts must use indexed queries — full-table scans for count queries are not acceptable."],
      ["NFR-PERF-04", "Application must support at least 20 concurrent users without response degradation on LAN."],
      ["NFR-PERF-05", "All tables with filter predicates must have appropriate indices (status, asset_type, department_id, request_id)."],
    ],
    [18, 82]
  ),

  h2("5.2 Safety Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["NFR-SAFE-01", "All multi-table write operations must be wrapped in a SQLite transaction. Partial writes are not permitted."],
      ["NFR-SAFE-02", "Foreign key constraints must be enforced at the database layer (PRAGMA foreign_keys = ON)."],
      ["NFR-SAFE-03", "The system must not allow the same asset to be allocated to two concurrent open requests."],
      ["NFR-SAFE-04", "E-waste disposal records are immutable — no update or delete on e_waste_records after insertion."],
    ],
    [18, 82]
  ),

  h2("5.3 Security Requirements"),
  buildTable(
    ["ID", "Requirement"],
    [
      ["NFR-SEC-01", "All routes enforce server-side role checks. Client-side checks are for UX only."],
      ["NFR-SEC-02", "Passwords stored exclusively as bcrypt hashes (cost 10). Plain-text passwords never persisted or logged."],
      ["NFR-SEC-03", "Session tokens are signed JWTs in HttpOnly, SameSite=Strict, Secure cookies."],
      ["NFR-SEC-04", "All database queries use parameterized statements (better-sqlite3 prepared statements). SQL interpolation is prohibited."],
      ["NFR-SEC-05", "Server actions import server-only to prevent client bundle inclusion of sensitive modules."],
      ["NFR-SEC-06", "API routes return 401 Unauthorized for unauthenticated requests; they do not redirect."],
      ["NFR-SEC-07", "User input rendered in HTML must be escaped to prevent XSS. dangerouslySetInnerHTML is prohibited."],
    ],
    [18, 82]
  ),

  h2("5.4 Software Quality Attributes"),
  buildTable(
    ["Attribute", "Requirement"],
    [
      ["Correctness",     "Zero TypeScript compilation errors required at build time (tsc --noEmit)."],
      ["Reliability",     "All writes are synchronous (better-sqlite3) — no async data races on write paths."],
      ["Maintainability", "Business logic confined to server actions (app/actions/) and API routes (app/api/). UI components have no direct DB access."],
      ["Testability",     "Server action functions accept typed parameters and return typed results, enabling unit testing without a running HTTP server."],
      ["Usability",       "Every form provides inline error messages adjacent to the offending field without full page reload."],
      ["Portability",     "Requires only Node.js and npm dependencies; no OS-specific packages beyond better-sqlite3 native bindings."],
    ],
    [22, 78]
  ),

  h2("5.5 Business Rules"),
  buildTable(
    ["ID", "Rule"],
    [
      ["BR-01", "Only INVENTORY_MANAGER can mutate asset records (status, serial number, EOL date, department). All other roles have read-only access to asset data."],
      ["BR-02", "The 4-step approval sequence is strictly ordered: IM Initial Review → JIO Approval → SIO Approval → IM Final Processing. Steps cannot be skipped."],
      ["BR-03", "A rejection at any approval step immediately terminates the workflow. A new request must be created."],
      ["BR-04", "An asset can be issued only after passing all four approval steps."],
      ["BR-05", "Repair requests are not permitted for assets permanently donated to NGO or educational institutions."],
      ["BR-06", "EOL dates are derived from ICT category policy: Cat I — 1 yr (consumables), Cat II — 5 yr, Cat III — 7 yr, Cat IV — 10 yr from issue date."],
      ["BR-07", "Data-wipe confirmation is mandatory before any e-waste disposal record can be saved."],
      ["BR-08", "DEPT_USER can view and manage only their own department's requests."],
      ["BR-09", "A department cannot be deleted if any users or assets are assigned to it."],
      ["BR-10", "Auto-generated ID formats: Assets = AST-YYYY-NNNN, Requests = REQ-YYYY-NNNN, Users = EMP-NNN."],
    ],
    [12, 88]
  ),
  pageBreak(),

  // ── 6. Other Requirements ────────────────────────────────────────────────
  h1("6. Other Requirements"),

  h2("6.1 Appendix A: Glossary"),
  buildTable(
    ["Term", "Definition"],
    [
      ["IM",                 "Inventory Manager — sole custodian of the physical asset inventory and primary operator."],
      ["JIO",                "Junior Inspection Officer — first-level approval authority (Step 2)."],
      ["SIO",                "Senior Inspection Officer — second-level approval authority (Step 3)."],
      ["DEPT_USER",          "Department User / Request Head — submits requisitions and service requests on behalf of workers."],
      ["Asset",              "Any physical IT equipment tracked by the system (hardware only; software licenses excluded)."],
      ["Asset ID",           "System-generated unique identifier for each asset (format: AST-YYYY-NNNN)."],
      ["Requisition",        "A formal request to acquire a new asset for a worker or external organisation."],
      ["Request Number",     "System-generated unique identifier for each request (format: REQ-YYYY-NNNN)."],
      ["EOL",                "End of Life — the date after which an asset is considered obsolete per the ICT category policy."],
      ["Serial Number",      "The manufacturer's hardware identifier of a physical asset; unique within the system when provided."],
      ["E-Waste",            "Electronic Waste — end-of-life or unserviceable IT assets formally decommissioned for disposal."],
      ["NGO Assignment",     "Asset donated or loaned to a registered Non-Governmental Organisation."],
      ["Education Assignment","Asset donated or loaned to an accredited educational institution."],
      ["Loan",               "A temporary external assignment where the asset is expected to be returned."],
      ["Donation",           "A permanent external assignment; the asset is not expected to return to inventory."],
      ["ICT Category",       "Organisation-defined asset classification determining default useful lifespan (I–IV)."],
      ["On Hold",            "A request status set by IM at Step 1 when no suitable asset is currently available. The approval step remains Pending; the request is paused until IM decides to forward or reject."],
      ["Condemned",          "An asset status indicating the asset has been formally approved for decommissioning via the JIO→SIO condemnation workflow, and is pending physical disposal."],
      ["Disposed",           "Terminal asset status; set after IM records the physical disposal method (GeM Auction / Open Tender / MSTC / Authorised e-Waste Recycler). Asset is removed from active inventory."],
      ["WAL Mode",           "Write-Ahead Logging — a SQLite concurrency mode enabling concurrent reads during writes."],
      ["JWT",                "JSON Web Token — a signed, self-contained token used for session authentication."],
      ["Server Action",      "A Next.js 'use server' function running exclusively on the server."],
    ],
    [28, 72]
  ),

  h2("6.2 Appendix B: Analysis Models"),
  h3("B.1 Asset Lifecycle State Machine"),
  para("Assets transition through the following states:"),
  code("  [Available]   ─── IM Issues ──────────────> [Assigned]"),
  code("  [Assigned]    ─── Return Approved ────────> [Available]"),
  code("  [Assigned]    ─── Repair Approved ────────> [Maintenance]"),
  code("  [Maintenance] ─── IM Restores ─────────────> [Available]"),
  code("  [Any active]  ─── Condemnation Approved ──> [Condemned]"),
  code("  [Condemned]   ─── IM Records Disposal ─────> [Disposed]  (permanent; excluded from active views)"),

  blankLine(),
  h3("B.2 Approval Workflow State Diagram"),
  code("  [Pending]"),
  code("      | IM Initial Review (Step 1)"),
  code("      |── ON HOLD ──> [On Hold]  (approval stays Pending; IM can resume)"),
  code("      |── REJECT  ──> [Rejected]"),
  code("  [IM Review]"),
  code("      | JIO Approval (Step 2)"),
  code("      |── REJECT ────> [Rejected]"),
  code("  [JIO Approved]"),
  code("      | SIO Approval (Step 3)"),
  code("      |── REJECT ────> [Rejected]"),
  code("  [SIO Approved]"),
  code("      | IM Final Processing (Step 4)"),
  code("  [Issued]"),

  blankLine(),
  h3("B.3 Role-Based Page Access Matrix"),
  buildTable(
    ["Page / Feature", "IM", "SIO", "JIO", "DEPT_USER"],
    [
      ["Dashboard",                      "YES", "YES", "YES", "YES"],
      ["EOL Alert Panel",                "YES", "NO",  "NO",  "NO"],
      ["Assets — View",                  "YES", "YES", "YES", "YES"],
      ["Assets — Add / Edit / Delete",   "YES", "NO",  "NO",  "NO"],
      ["Requests — View All",            "YES", "YES", "YES", "Own only"],
      ["New Asset Request (Worker)",     "NO",  "NO",  "NO",  "YES"],
      ["New Asset Request (NGO/Edu.)",   "NO",  "NO",  "NO",  "YES"],
      ["Return / Repair Request",        "NO",  "NO",  "NO",  "YES"],
      ["Approvals — Step 1 (IM Init.)",  "YES", "NO",  "NO",  "NO"],
      ["Approvals — Step 2 (JIO)",       "NO",  "NO",  "YES", "NO"],
      ["Approvals — Step 3 (SIO)",       "NO",  "YES", "NO",  "NO"],
      ["Approvals — Step 4 (IM Final)",  "YES", "NO",  "NO",  "NO"],
      ["Approvals — Service (IM)",       "YES", "NO",  "NO",  "NO"],
      ["E-Waste — Initiate Disposal",    "YES", "NO",  "NO",  "NO"],
      ["E-Waste — Disposal Log",         "YES", "NO",  "NO",  "NO"],
      ["E-Waste — Print Report",         "YES", "NO",  "NO",  "NO"],
      ["Users — View / Manage",          "YES", "NO",  "NO",  "NO"],
      ["Departments",                    "YES", "NO",  "NO",  "NO"],
      ["My Account / Profile",           "YES", "YES", "YES", "YES"],
      ["Print Reports",                  "YES", "YES", "YES", "YES"],
    ],
    [52, 12, 12, 12, 12]
  ),

  h2("6.3 Appendix C: To Be Determined (TBD) List"),
  buildTable(
    ["#", "TBD Item", "Section", "Target Version"],
    [
      ["TBD-01", "Email notification integration (SMTP) — notify JIO/SIO when approval step is created",  "§3.4, §4.4", "v1.1"],
      ["TBD-02", "Transfer module — asset transfers between departments (routes are placeholder stubs)",    "§4",         "v1.1"],
      ["TBD-03", "Bulk import of assets via CSV upload",                                                   "§4.2",       "v1.2"],
      ["TBD-04", "Multi-tenant support — isolating data between multiple organisations",                    "§2.5",       "v2.0"],
      ["TBD-05", "Dashboard notifications panel — polled in-app notifications for pending approvals",       "§4.8",       "v1.1"],
      ["TBD-06", "Password complexity policy and account lockout after N failed login attempts",            "§5.3",       "v1.1"],
      ["TBD-07", "Confirm which report types each role should be able to print",                           "§4.8",       "v1.0"],
      ["TBD-08", "Audit log export — exporting asset_history as CSV/PDF for external compliance audits",    "§4.6",       "v1.1"],
    ],
    [8, 54, 16, 22]
  ),

  blankLine(),
  blankLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 0 },
    children: [new TextRun({ text: "— End of Software Requirements Specification — IT-Asset v1.0 —", italics: true, size: 20, color: "777777" })],
  }),
];

// ── assemble document ────────────────────────────────────────────────────────

const doc = new Document({
  creator: "IT-Asset Development Team",
  title: "Software Requirements Specification — IT-Asset",
  description: "IEEE 830-style SRS for IT-Asset, an IT Asset Management System",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 36, color: BLUE },
        paragraph: { spacing: { before: 480, after: 240 } },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 28, color: "2E4A7A" },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 24, color: "444444" },
        paragraph: { spacing: { before: 280, after: 120 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top:    convertInchesToTwip(1.0),
          bottom: convertInchesToTwip(1.0),
          left:   convertInchesToTwip(1.2),
          right:  convertInchesToTwip(1.0),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
            children: [
              new TextRun({ text: "IT-Asset — Software Requirements Specification", size: 18, color: "777777" }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
            children: [
              new TextRun({ text: "Page ", size: 18, color: "777777" }),
              new PageNumberElement({ size: 18, color: "777777" }),
              new TextRun({ text: "  |  Version 1.0  |  April 2026  |  NIT Meghalaya", size: 18, color: "777777" }),
            ],
          }),
        ],
      }),
    },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("SRS.docx", buffer);
console.log("SRS.docx written successfully.");
