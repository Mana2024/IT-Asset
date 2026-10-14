import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { writeFileSync } from "fs";

const preparedDate = "July 3, 2026";
const reportTitle = "Project Report";
const projectName = "IT-Asset";
const organization = "NIT Meghalaya";

function text(value, options = {}) {
  return new TextRun({
    text: value,
    font: "Calibri",
    size: options.size ?? 22,
    bold: options.bold,
    italics: options.italics,
    color: options.color,
  });
}

function para(children, options = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [text(children)],
    heading: options.heading,
    alignment: options.alignment,
    bullet: options.bullet,
    spacing: { before: options.before ?? 0, after: options.after ?? 120 },
  });
}

function heading(value, level = HeadingLevel.HEADING_1) {
  return para(value, { heading: level, before: 240, after: 120 });
}

function bullet(value) {
  return para(value, { bullet: { level: 0 }, after: 80 });
}

function cell(value, options = {}) {
  return new TableCell({
    shading: options.header ? { fill: "D9EAF7" } : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      para([text(value, { bold: options.header, size: 20 })], {
        after: 0,
      }),
    ],
  });
}

function table(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
      insideH: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
      insideV: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
    },
    rows: rows.map((row, index) =>
      new TableRow({
        children: row.map((value) => cell(value, { header: index === 0 })),
      }),
    ),
  });
}

const children = [
  para([text(reportTitle, { bold: true, size: 40 })], {
    alignment: AlignmentType.CENTER,
    after: 220,
  }),
  para([text(`${projectName} - Centralized IT Asset Management System`, { bold: true, size: 28 })], {
    alignment: AlignmentType.CENTER,
    after: 120,
  }),
  para([text(`Organization: ${organization}`, { size: 22 })], {
    alignment: AlignmentType.CENTER,
    after: 80,
  }),
  para([text(`Prepared Date: ${preparedDate}`, { size: 22 })], {
    alignment: AlignmentType.CENTER,
    after: 360,
  }),

  heading("1. Introduction"),
  para(
    "IT-Asset is a centralized web-based IT asset management system developed for NIT Meghalaya. The system digitizes the management of institutional IT assets from registration and allocation through maintenance, transfers, returns, end-of-life tracking, and condemnation. It replaces scattered manual records with a controlled workflow that improves accountability, traceability, and visibility across departments.",
  ),
  para(
    "The project is implemented as a Next.js application backed by a local SQLite database. It supports role-based access for Inventory Managers, SIO, JIO, and Department Users, with structured approvals for requests and asset lifecycle events.",
  ),

  heading("2. Project Objectives"),
  bullet("Maintain a single authoritative inventory of IT assets with unique asset identifiers."),
  bullet("Enable departments to submit asset requisitions, returns, repairs, transfers, and service requests online."),
  bullet("Provide a multi-level approval workflow involving Inventory Manager, JIO, and SIO roles where required."),
  bullet("Track asset assignment, department ownership, issued dates, status, and end-of-life information."),
  bullet("Maintain audit history for asset events and request decisions."),
  bullet("Generate operational reports for utilization, allocations, requests, maintenance, and external issue records."),

  heading("3. Scope"),
  para(
    "The system covers IT asset registration, user and department administration, request processing, approval tracking, inventory status management, employee records, end-of-life inventory, maintenance handling, external issuance, and reporting. The project is intended for browser-based use on an institutional server and assumes authenticated access by authorized users.",
  ),

  heading("4. Technology Stack"),
  table([
    ["Layer", "Technology Used"],
    ["Frontend and Routing", "Next.js 16 App Router, React 19, TypeScript"],
    ["Styling", "Tailwind CSS 4 and shared UI components"],
    ["Backend", "Next.js Server Components, Server Actions, and API routes"],
    ["Database", "SQLite using better-sqlite3 with WAL mode"],
    ["Authentication", "HTTP-only session cookies, bcryptjs password hashing, OTP and reset flows"],
    ["Email", "Nodemailer for OTP and workflow notifications"],
    ["Documents", "docx package for generated Word files"],
  ]),

  heading("5. User Roles"),
  table([
    ["Role", "Primary Responsibilities"],
    ["Inventory Manager", "Manages assets, users, departments, assignments, approvals, final issuance, maintenance, and condemnation processing."],
    ["SIO", "Acts as a senior approval authority for requisitions and other workflows requiring higher-level approval."],
    ["JIO", "Reviews requests as an intermediate approval authority."],
    ["Department User", "Submits and tracks requests for their department and views department-related assets."],
  ]),

  heading("6. Major Modules"),
  table([
    ["Module", "Description"],
    ["Authentication", "Login, OTP verification, forgot password, reset password, first-login password update, and logout."],
    ["Dashboard", "Role-aware summary of inventory, pending requests, approvals, users, and recent activity."],
    ["Assets", "Asset creation, editing, detailed view, status tracking, asset document generation, and lifecycle records."],
    ["Requests", "New asset, special, service, external, return, repair, and condemnation requests."],
    ["Approvals", "Step-wise approval processing for Inventory Manager, JIO, and SIO reviewers."],
    ["Assignments", "Asset assignment creation and assignment detail tracking."],
    ["Transfers", "Department-to-department transfer workflow with Inventory Manager approval."],
    ["Maintenance", "Maintenance request creation, processing, and detail tracking."],
    ["Departments and Employees", "Department records, employee records, and employee-linked request information."],
    ["Users", "System user creation, editing, activation status, and role assignment."],
    ["Reports", "CSV-exportable reports for utilization, department allocation, requests, external allocation, and maintenance summaries."],
    ["Notifications and EOL", "End-of-life alerts and inventory views for assets requiring retirement or disposal attention."],
  ]),

  heading("7. System Architecture"),
  para(
    "IT-Asset follows a server-rendered web application architecture. Browser users interact with authenticated pages in the App Router. Server Components, Server Actions, and API routes handle business logic and database operations. The data layer uses shared database helpers and TypeScript models in the lib directory. SQLite stores departments, users, assets, requests, approvals, request items, asset history, employees, and password reset tokens.",
  ),
  bullet("Client interface: dashboard pages, forms, tables, filters, badges, and workflow action buttons."),
  bullet("Server layer: route handlers and server actions for authentication, assets, requests, approvals, transfers, users, departments, employees, assignments, maintenance, and reports."),
  bullet("Data layer: better-sqlite3 client, schema definitions, session helpers, formatting utilities, and type definitions."),
  bullet("External service: SMTP email delivery for OTP, password reset, and workflow notifications."),

  heading("8. Database Overview"),
  table([
    ["Table", "Purpose"],
    ["departments", "Stores department names and creation timestamps."],
    ["users", "Stores authenticated users, roles, contact details, department links, and active status."],
    ["assets", "Stores IT asset registry records, serial numbers, status, department allocation, ICT category, EOL data, and disposal details."],
    ["requests", "Stores requisition and service request records, requester details, workflow state, allocation fields, external issue fields, and condemnation fields."],
    ["approvals", "Stores approval steps, statuses, reviewers, comments, and review timestamps."],
    ["request_items", "Stores multi-item request asset types, quantities, and allocated asset links."],
    ["asset_history", "Stores chronological asset events with actor and notes."],
    ["employees", "Stores employee master records linked to departments."],
    ["password_reset_tokens", "Stores reset tokens, expiry timestamps, and usage status."],
  ]),

  heading("9. Key Workflows"),
  para([text("New asset requisition: ", { bold: true }), text("A Department User submits a request. The request passes through Inventory Manager initial review, JIO approval, SIO approval, and Inventory Manager final processing. After final allocation, the selected asset is issued and the request status is updated.")]),
  para([text("Transfer request: ", { bold: true }), text("A Department User submits a transfer request for an asset and target department. The Inventory Manager reviews the transfer and, if approved, updates the asset department and records the transfer event.")]),
  para([text("Return and repair: ", { bold: true }), text("Department Users submit service requests for assigned assets. The system records the service reason and allows Inventory Manager processing, with asset status updated according to the service outcome.")]),
  para([text("Condemnation and disposal: ", { bold: true }), text("Assets reaching end of life can be identified, reviewed, and moved through condemnation and disposal tracking, including disposal method, recycler, reference, and date.")]),
  para([text("Authentication: ", { bold: true }), text("Users sign in with employee credentials and OTP verification. Password reset and first-login flows support secure account recovery and onboarding.")]),

  heading("10. Security and Access Control"),
  bullet("Role-based access separates department users from reviewers and inventory administrators."),
  bullet("Passwords are hashed before storage using bcryptjs."),
  bullet("Sessions are managed using server-side verification and HTTP-only cookies."),
  bullet("OTP and reset flows use email-based verification for sensitive account actions."),
  bullet("Database relations and constraints help preserve consistency between users, departments, assets, requests, approvals, and history records."),

  heading("11. Reporting Facilities"),
  para(
    "The Reports module provides operational visibility through selectable report types and CSV export. Available report categories include asset utilization, department allocation, external allocations, request and approval logs, and maintenance summaries. Date filtering is available for request reports.",
  ),

  heading("12. Benefits"),
  bullet("Improves transparency by preserving a clear audit trail for asset events and request decisions."),
  bullet("Reduces manual paperwork in requisition, approval, transfer, and service workflows."),
  bullet("Helps inventory staff identify available, assigned, maintenance, returned, condemned, and disposed assets."),
  bullet("Supports policy-based asset lifecycle tracking through ICT categories and end-of-life dates."),
  bullet("Centralizes departmental accountability for institutional IT equipment."),

  heading("13. Limitations"),
  bullet("The current deployment model is single-server oriented and uses SQLite, which is simple and reliable but not designed for horizontal scaling."),
  bullet("Email delivery depends on correct SMTP configuration and network availability."),
  bullet("Operational reports should be reviewed against the active database schema before production use to ensure all query field names match deployed tables."),
  bullet("The system assumes online browser access and does not provide an offline mode."),

  heading("14. Future Enhancements"),
  bullet("Add barcode or QR code scanning for faster physical inventory verification."),
  bullet("Introduce richer dashboard analytics with charts and scheduled exports."),
  bullet("Add attachment support for purchase documents, repair invoices, condemnation approvals, and handover forms."),
  bullet("Add role-specific notification preferences and in-app notification history."),
  bullet("Provide database backup, restore, and archival utilities for administrators."),
  bullet("Consider PostgreSQL migration if multi-site or high-concurrency deployment becomes necessary."),

  heading("15. Conclusion"),
  para(
    "IT-Asset provides a practical and structured foundation for managing IT assets at NIT Meghalaya. By combining inventory records, approval workflows, user roles, reporting, and lifecycle tracking in one application, the project supports better administrative control and more reliable asset accountability. With continued refinement of reporting, notifications, and deployment operations, the system can serve as a dependable institutional platform for IT asset governance.",
  ),
];

const doc = new Document({
  creator: "IT-Asset Development Team",
  title: `${projectName} ${reportTitle}`,
  description: "Project report for the IT-Asset centralized IT asset management system.",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
        paragraph: { spacing: { after: 120 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 30, bold: true, color: "1F4E79" },
        paragraph: { spacing: { before: 280, after: 120 } },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, color: "1F4E79" },
        paragraph: { spacing: { before: 220, after: 100 } },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 900, right: 900, bottom: 900, left: 900 },
        },
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("Project Report.docx", buffer);
console.log("Project Report.docx created successfully.");
