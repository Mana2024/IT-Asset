# Software Requirements Specification (SRS)
## Asset-IT — Centralized IT Asset Management System

**Version:** 3.0  
**Date:** April 2026  

---

## Table of Contents

1. Introduction
2. Overall Description
3. System Actors & Roles
4. **Inventory Manager — Role, Process & Relationships**
5. **Asset Assignment — Workers vs NGO / Education**
6. **E-Waste Management**
7. Functional Requirements
8. Non-Functional Requirements
9. Entity-Relationship (ER) Diagram
10. Database Schema
11. System Flowcharts
12. Use Case Summary
13. Technology Stack

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **Asset-IT**, a centralized web-based IT Asset Management System. It describes functional and non-functional requirements, data model, and workflows for developers, testers, and stakeholders.

### 1.2 Scope
Asset-IT enables an organization to:
- Maintain a complete inventory of IT assets (laptops, desktops, servers, printers, etc.)
- Process asset requisitions through a structured 4-level approval workflow
- Track asset lifecycle from procurement to retirement and end-of-life disposal
- Assign assets to **internal workers** or to **external NGOs / educational institutions**
- Manage asset returns and repair/maintenance requests
- Handle **e-waste** (end-of-life assets) through a formal disposal and documentation workflow
- Generate printable inventory, requisition, and e-waste reports
- Enforce role-based access control across all operations

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| IM | Inventory Manager — sole custodian of the physical asset inventory |
| JIO | Junior Inspection Officer — first-level approval authority |
| SIO | Senior Inspection Officer — second-level approval authority |
| DEPT_USER | Department User / Request Head — submits requests on behalf of workers |
| Asset | Any IT equipment tracked by the system |
| Requisition | A formal request to acquire, return, or repair an asset |
| EOL | End of Life — the date after which an asset is considered obsolete |
| Serial Number | Unique hardware identifier of a physical asset |
| E-Waste | End-of-life assets formally decommissioned and sent for disposal/recycling |
| NGO Assignment | Asset donated/loaned to a registered Non-Governmental Organisation |
| Education Assignment | Asset donated/loaned to an educational institution |

---

## 2. Overall Description

### 2.1 Product Perspective
Asset-IT is a standalone full-stack web application using a server-side SQLite database, JWT-based session management, and a React server-component frontend. All business logic runs on the server.

### 2.2 User Classes

| Role | Description |
|------|-------------|
| **INVENTORY_MANAGER** | Full access. Sole owner of asset data. Manages procurement, assignment, returns, repairs, e-waste disposal, users, and departments. |
| **SIO** | Reviews and approves/rejects at Step 3 (policy/budget compliance). |
| **JIO** | Reviews and approves/rejects at Step 2 (validity and need check). |
| **DEPT_USER** | Submits requisitions and service requests on behalf of workers or for NGO/education purposes. Views own requests. |

---

## 3. System Actors & Roles

```
+------------------+--------------------------------------------------+
| DEPT_USER        | - Submit new asset requisitions                  |
| (Request Head)   |   (for a worker OR for an NGO / institution)    |
|                  | - Submit return / repair requests                |
|                  | - View own request history                       |
|                  | - Cancel pending requests                        |
+------------------+--------------------------------------------------+
| JIO              | - View assigned approval queue                   |
|                  | - Approve or reject at Step 2                    |
|                  | - View request details and IM notes              |
+------------------+--------------------------------------------------+
| SIO              | - View assigned approval queue                   |
|                  | - Approve or reject at Step 3                    |
|                  | - View request details, IM notes, JIO comments   |
+------------------+--------------------------------------------------+
| INVENTORY_       | - Full CRUD on assets and users                  |
| MANAGER          | - Manage departments                             |
|                  | - IM Initial Review (Step 1)                     |
|                  | - IM Final Processing & Issuance (Step 4)        |
|                  |   → issues to worker OR to NGO/education         |
|                  | - Process return / repair requests               |
|                  | - Initiate and record e-waste disposal           |
|                  | - Print inventory, requisition, e-waste reports  |
+------------------+--------------------------------------------------+
```

---

## 4. Inventory Manager — Role, Process & Relationships

### 4.1 Who Is the Inventory Manager?

The Inventory Manager (IM) is the **central authority** of the asset management system. Every physical asset enters, moves through, and exits the organization only with the IM's explicit action. No asset is issued, returned, repaired, donated, or disposed of without IM involvement.

The IM is the only role with:
- Write access to the asset registry
- Authority to physically issue or reclaim hardware
- Responsibility to document e-waste disposal
- Visibility into the complete asset lifecycle trail

### 4.2 What Does the Inventory Manager Do?

| Activity | Description |
|----------|-------------|
| **Asset Procurement** | Adds newly purchased assets to the system with type, serial number, description, department, and initial status = Available. |
| **Stock Review (Step 1)** | When a requisition arrives, IM checks current stock, identifies a suitable tentative asset, adds internal notes, and forwards the request to JIO. |
| **Asset Issuance (Step 4)** | After full approval (JIO + SIO), IM selects the exact asset (serial number visible), records the recipient (worker name or NGO/institution), condition, EOL date, and issues the asset. |
| **Return Processing** | On a return request, IM reviews the reason, approves, and marks the asset as Available again (dates cleared). |
| **Repair Processing** | On a repair request, IM reviews the fault description, approves, and marks the asset as Maintenance. |
| **E-Waste Initiation** | When an asset reaches its EOL date or is deemed unserviceable, IM initiates a formal e-waste disposal record and marks the asset as Disposed. |
| **User & Department Admin** | Creates and manages user accounts (employees, JIO, SIO, DEPT_USER). Creates and manages departments. Resets passwords. Deactivates accounts. |
| **Reporting** | Generates printable inventory reports, requisition reports, and e-waste disposal logs. |

### 4.3 The Inventory Manager's Process (End-to-End)

```
1. PROCUREMENT
   IM receives hardware → adds asset to system
   asset.status = Available

        |
        v

2. REQUISITION ARRIVES (from DEPT_USER)
   IM receives Step 1 task — "IM Initial Review"
   IM checks stock:
     - Is a suitable asset available?
     - Link tentative asset (optional)
     - Write internal notes (condition, availability remarks)
   IM decision:
     → Forward to JIO  (status = IM Review)
     → Reject          (status = Rejected, workflow ends)

        |
        v

3. APPROVAL CHAIN (Steps 2 & 3 — JIO then SIO)
   IM is notified of final SIO decision:
     → SIO Approved → IM gets Step 4 task
     → SIO Rejected → IM is informed; no further action

        |
        v

4. FINAL ISSUANCE (Step 4)
   IM selects exact asset (serial number required)
   IM records:
     - Recipient type: WORKER or NGO / EDUCATION
     - Recipient name, designation / organisation name
     - Condition on issue (Good / Fair / Refurbished)
     - EOL date
     - Acknowledgement checkbox
   IM issues → asset.status = Assigned; request.status = Issued

        |
        v

5. IN-SERVICE EVENTS
   DEPT_USER submits Return or Repair request
   IM reviews and approves:
     Return → asset.status = Available
     Repair → asset.status = Maintenance → IM manually sets
              back to Available after servicing

        |
        v

6. END OF LIFE
   Asset reaches EOL date OR is deemed unserviceable
   IM initiates e-waste record:
     - Documents asset ID, serial number, disposal method,
       vendor (if recycler), date, and authorisation notes
   asset.status = Disposed
   Asset removed from active inventory; appears only in
   e-waste disposal log
```

### 4.4 Inventory Manager's Relationships with Other Roles

```
+--------------------+        submits requisition        +------------+
|    DEPT_USER       |---------------------------------->| SYSTEM     |
|  (Request Head)    |<------ status updates ------------|            |
+--------------------+                                   +-----+------+
                                                               |
                                              Step 1 task      |
                                                               v
                                                   +------------------+
      +---------- IM reviews, notes, ------------>| INVENTORY        |
      |            forwards or rejects            | MANAGER          |
      |                                           |                  |
      |   Provides stock context to JIO/SIO       |  Step 4 issuer   |
      |   (via tentative asset + IM notes)        |  Return handler  |
      |                                           |  Repair handler  |
      |                                           |  E-waste owner   |
      v                                           +--+----+----------+
+----------+   Step 2 approval                      |    |
|   JIO    |-------------------------------------------+  |
+----------+   (IM's notes inform JIO decision)        |  |
                                                       |  |
+----------+   Step 3 approval                         |  |
|   SIO    |--------------------------------------------+  |
+----------+   (IM's notes + JIO comments inform SIO)     |
                                                           |
                      Final issuance confirmed  <----------+
```

**Summary of relationships:**

| Other Role | IM's Relationship |
|------------|-------------------|
| DEPT_USER | IM is the fulfiller — receives requests, issues assets, processes returns/repairs, ultimately resolves every DEPT_USER request. |
| JIO | IM prepares the ground (notes + tentative asset) that informs JIO's approval decision. IM does not control JIO but provides essential context. |
| SIO | Same as JIO — IM's notes travel with the request through all approval steps. SIO sees the full IM context before deciding. |
| System / DB | IM is the only actor who can mutate asset records (status, dates, serial number, EOL). All other roles read asset data but cannot change it. |

---

## 5. Asset Assignment — Workers vs NGO / Education

### 5.1 Overview

When the Inventory Manager issues an asset at Step 4, two distinct assignment tracks exist:

| Track | Recipient | Purpose |
|-------|-----------|---------|
| **Worker Assignment** | Employee within the organisation | Operational use — the worker uses the asset to perform their job |
| **NGO / Education Assignment** | Registered NGO or educational institution | Social / CSR purpose — asset is donated or loaned for community benefit |

The track is selected by the DEPT_USER when submitting the requisition and confirmed by the IM at issuance.

### 5.2 Worker Assignment

**Who submits:** DEPT_USER on behalf of an internal employee.

**Requisition fields specific to worker assignment:**

| Field | Description |
|-------|-------------|
| Recipient Type | WORKER |
| Worker Name | Full name of the employee receiving the asset |
| Employee ID | Organisation-internal employee ID |
| Worker Email | Official email address |
| Worker Designation | Job title / role |
| Worker Phone | Contact number |
| Department | Department to which the asset is charged |
| Justification | Business reason for the asset request |

**Issuance by IM:**

- IM confirms worker identity details at Step 4.
- Asset is tagged to the worker's department.
- EOL date is set based on asset type policy.
- Condition on issue is recorded (Good / Fair / Refurbished).
- Acknowledgement by the IM that asset is handed over.

**Post-issuance:**

- The DEPT_USER of the worker's department can submit a Return or Repair request for the asset.
- On return, the asset goes back to Available stock.

### 5.3 NGO / Education Assignment

**Who submits:** DEPT_USER on behalf of a programme manager or CSR coordinator.

**Requisition fields specific to NGO / education assignment:**

| Field | Description |
|-------|-------------|
| Recipient Type | NGO or EDUCATION |
| Organisation Name | Legal name of the NGO or educational institution |
| Organisation Registration No. | Govt. registration or recognition number |
| Contact Person | Name of the liaison at the receiving organisation |
| Contact Email | Email of the liaison |
| Contact Phone | Phone of the liaison |
| Purpose / Programme | Brief description of how the asset will be used |
| Justification | Internal CSR / social responsibility rationale |

**Issuance by IM:**

- IM verifies that the asset is appropriate for external assignment (condition, age, compliance).
- Asset is tagged with the external organisation's details.
- EOL date is set — typically shorter for older/refurbished stock going externally.
- A donation/loan acknowledgement is recorded.
- IM notes whether the assignment is a **permanent donation** or a **temporary loan**.

**Post-issuance:**

- For **loans**: DEPT_USER can submit a Return request when the loan period ends.
- For **donations**: the asset is marked as permanently transferred. It is flagged for removal from active inventory and, at EOL, enters the e-waste workflow at the organisation's end (documented in notes).
- Repair requests are not applicable for donated assets; for loaned assets, the IM handles repair on return.

### 5.4 Comparison: Worker vs NGO / Education Assignment

| Aspect | Worker | NGO / Education |
|--------|--------|-----------------|
| Recipient identity | Internal employee (ID verified in-system) | External organisation (registration number recorded) |
| Asset tagging | Tagged to employee + department | Tagged to external organisation |
| Return possible | Yes, via DEPT_USER Return request | Yes (loan) / No (donation) |
| Repair possible | Yes, via DEPT_USER Repair request | Only if loaned and returned first |
| EOL handling | Standard EOL → e-waste flow | Donation: EOL at external org; Loan: EOL after return |
| CSR reporting | Not applicable | Asset listed in CSR / donation report |

---

## 6. E-Waste Management

### 6.1 What Is E-Waste in This System?

E-Waste (Electronic Waste) refers to assets that have reached their **End of Life (EOL)** date or have been deemed **unserviceable** after repeated repair. These assets must be formally decommissioned and disposed of through an approved recycling or disposal process rather than being abandoned or informally discarded.

Asset-IT manages e-waste by:
- Tracking EOL dates on every asset
- Alerting the IM when assets are approaching or past their EOL
- Providing a formal e-waste disposal workflow
- Maintaining a permanent e-waste disposal log

### 6.2 When Does an Asset Become E-Waste?

An asset qualifies for e-waste disposal under any of the following conditions:

| Trigger | Description |
|---------|-------------|
| EOL Date Reached | The asset's `end_of_life_date` is on or before today's date |
| Unserviceable After Repair | IM marks an asset in Maintenance as beyond economic repair |
| Obsolescence | IM manually flags an asset as technologically obsolete |
| Physical Damage | Asset is returned damaged beyond repair |

### 6.3 E-Waste Disposal Process

```
1. EOL ALERT
   System flags assets where end_of_life_date <= today
   IM sees these in the "EOL Alert" panel on the dashboard

        |
        v

2. IM INITIATES DISPOSAL
   IM opens the asset record and clicks "Initiate E-Waste Disposal"
   IM fills the disposal form:
     - Disposal reason (EOL / Unserviceable / Obsolete / Damaged)
     - Disposal method:
         → Certified Recycler   (sent to an approved recycling vendor)
         → In-house Shredding   (data-bearing media destroyed on-site)
         → Donation Scrap       (unusable parts donated to a trade school)
         → Government Handover  (assets handed to a designated govt body)
     - Recycling vendor name (if applicable)
     - Disposal date
     - Authorisation notes / reference number
     - IM confirms that data has been wiped / destroyed (checkbox)

        |
        v

3. SYSTEM RECORDS DISPOSAL
   asset.status = Disposed
   e_waste_records row inserted (all disposal details stored)
   Asset removed from active Available / Assigned / Maintenance views
   Asset remains visible only in the E-Waste Disposal Log

        |
        v

4. DISPOSAL LOG & REPORTING
   IM can view and print the E-Waste Disposal Log:
     - Asset ID, serial number, type
     - EOL date, disposal date
     - Disposal method and vendor
     - Data-wipe confirmation
     - Authorising IM name and timestamp
```

### 6.4 E-Waste Data Model

The `e_waste_records` table stores all disposal events:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-incremented record ID |
| asset_id | FK → assets.id | The asset being disposed |
| disposal_reason | TEXT | EOL / Unserviceable / Obsolete / Damaged |
| disposal_method | TEXT | Certified Recycler / In-house Shredding / Donation Scrap / Government Handover |
| vendor_name | TEXT | Name of recycling vendor (nullable) |
| disposal_date | TEXT | Date of physical disposal |
| data_wiped | INTEGER | 1 = confirmed wiped / destroyed, 0 = not applicable |
| authorisation_notes | TEXT | Reference numbers, authorisation remarks |
| disposed_by | FK → users.id | The IM who initiated the disposal |
| created_at | TEXT | Timestamp of record creation |

### 6.5 Asset Lifecycle Including E-Waste

```
              +----> Available <----+
              |          |          |
    IM adds   |          | IM       | Return
    asset     |          | issues   | approved
              |          v          |
              |       Assigned -----+
              |          |
              |          | Repair request approved
              |          v
              |     Maintenance
              |          |
              |          | IM restores after service
              +----------+
                         |
                         | EOL reached / unserviceable / obsolete
                         v
                     Disposed  ──────────────────────────>  E-Waste Log
                   (permanent terminal state)                (read-only)
```

### 6.6 E-Waste Reporting

The IM can generate a **printable E-Waste Disposal Report** that includes:
- All disposed assets in a selected date range
- Disposal method breakdown (pie / count)
- Data-wipe confirmation status
- Total count and asset-type breakdown
- Certifiable for audit / environmental compliance purposes

---

## 7. Functional Requirements

### 7.1 Authentication

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | Users log in using email and password. |
| FR-AUTH-02 | Passwords verified against bcrypt hash (cost 10). |
| FR-AUTH-03 | On login, a signed JWT is stored as HttpOnly cookie. |
| FR-AUTH-04 | All dashboard routes require a valid session. |
| FR-AUTH-05 | Users can change their own password after verifying current password. |
| FR-AUTH-06 | Users can save designation and phone to their profile. |

### 7.2 Department Management

| ID | Requirement |
|----|-------------|
| FR-DEPT-01 | Only INVENTORY_MANAGER can create, edit, and delete departments. |
| FR-DEPT-02 | A department cannot be deleted if it has users or assets. |

### 7.3 User Management

| ID | Requirement |
|----|-------------|
| FR-USER-01 | Only INVENTORY_MANAGER can create and edit user accounts. |
| FR-USER-02 | Employee IDs are auto-generated (format: EMP-XXX). |
| FR-USER-03 | INVENTORY_MANAGER can reset any user password. |
| FR-USER-04 | INVENTORY_MANAGER can deactivate accounts. Deactivated users cannot log in. |

### 7.4 Asset Management

| ID | Requirement |
|----|-------------|
| FR-ASSET-01 | Only INVENTORY_MANAGER can add, edit, and delete assets. |
| FR-ASSET-02 | Each asset has a unique Asset ID and optionally a unique Serial Number. |
| FR-ASSET-03 | Asset statuses: Available, Assigned, Maintenance, Disposed. |
| FR-ASSET-04 | Only Available assets can be deleted. |
| FR-ASSET-05 | Assets track: issue date, end-of-life date, department, serial number, description. |
| FR-ASSET-06 | Asset list supports filtering by status/type and full-text search. |
| FR-ASSET-07 | A printable inventory report can be generated. |
| FR-ASSET-08 | The IM dashboard shows an EOL Alert panel listing assets where end_of_life_date <= today. |

### 7.5 New Asset Requisition Workflow

| ID | Requirement |
|----|-------------|
| FR-REQ-01 | DEPT_USER selects recipient type: WORKER or NGO / EDUCATION. |
| FR-REQ-02 | For WORKER: form captures worker name, employee ID, email, phone, designation, asset type, quantity, justification. |
| FR-REQ-03 | For NGO / EDUCATION: form captures organisation name, registration number, contact person, contact email, contact phone, purpose/programme, assignment type (loan or donation), justification. |
| FR-REQ-04 | On submission, a unique REQ-YYYY-NNNN number is generated and "IM Initial Review" step is created. |
| FR-REQ-05 | DEPT_USER can cancel a request only while it is in "Pending" status. |
| FR-REQ-06 | Requisition list shows request number, recipient type, recipient name, department, asset type, qty, status, and date. |
| FR-REQ-07 | A printable requisition report can be generated. |

### 7.6 Approval Workflow — New Asset

| ID | Requirement |
|----|-------------|
| FR-APPR-01 | **Step 1 — IM Initial Review:** IM checks stock, optionally links a tentative asset, records notes, forwards to JIO or rejects. |
| FR-APPR-02 | **Step 2 — JIO Approval:** JIO reviews need and validity, approves (to SIO) or rejects with mandatory comments. |
| FR-APPR-03 | **Step 3 — SIO Approval:** SIO reviews budget/policy, approves (to IM Final Processing) or rejects with mandatory comments. |
| FR-APPR-04 | **Step 4 — IM Final Processing:** IM selects exact asset (serial number visible), records recipient type (WORKER or NGO/EDUCATION), recipient details, condition, EOL date, assignment type (loan or donation for NGO/Education), and acknowledgement, then issues. |
| FR-APPR-05 | Rejection at any step immediately sets status to "Rejected" and stops workflow. |
| FR-APPR-06 | On issuance: asset.status = Assigned; asset.issued_date = today; asset.end_of_life_date set; request.status = Issued. |
| FR-APPR-07 | Each approval records reviewer ID, decision, comments, and timestamp. |

### 7.7 Return and Repair Workflow

| ID | Requirement |
|----|-------------|
| FR-SVC-01 | DEPT_USER submits Return or Repair request for any Assigned asset. |
| FR-SVC-02 | Repair requests are not available for assets marked as permanently donated to an NGO/education institution. |
| FR-SVC-03 | Form captures: type (Return/Repair), worker/org details, asset selection, reason. |
| FR-SVC-04 | On submission, "IM Service Processing" approval step is created. |
| FR-SVC-05 | IM approves or rejects with optional comments. |
| FR-SVC-06 | On Return approval: asset.status = Available; dates cleared; request.status = Returned. |
| FR-SVC-07 | On Repair approval: asset.status = Maintenance; request.status = Under Repair. |

### 7.8 E-Waste Management

| ID | Requirement |
|----|-------------|
| FR-EW-01 | Only INVENTORY_MANAGER can initiate e-waste disposal. |
| FR-EW-02 | Disposal can be initiated for assets with status Available, Assigned (returned first), or Maintenance. |
| FR-EW-03 | IM must record: disposal reason, disposal method, vendor name (if applicable), disposal date, data-wipe confirmation, and authorisation notes. |
| FR-EW-04 | On disposal: asset.status = Disposed; an e_waste_records row is inserted. |
| FR-EW-05 | Disposed assets are removed from all active inventory views and appear only in the E-Waste Disposal Log. |
| FR-EW-06 | The IM dashboard shows an EOL Alert panel for assets approaching or past their EOL date. |
| FR-EW-07 | A printable E-Waste Disposal Report can be generated, filterable by date range and disposal method. |

---

## 8. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Security | All routes enforce server-side role checks. |
| NFR-02 | Security | Passwords stored as bcrypt hashes (cost 10). |
| NFR-03 | Security | Sessions stored as signed HttpOnly JWT cookies. |
| NFR-04 | Performance | SQLite WAL mode for concurrent reads. |
| NFR-05 | Performance | Foreign key constraints enforced at DB layer. |
| NFR-06 | Usability | Inline form validation without full page reload. |
| NFR-07 | Usability | Print views auto-trigger browser print dialog. |
| NFR-08 | Reliability | All multi-table writes wrapped in SQLite transactions. |
| NFR-09 | Maintainability | Full TypeScript — zero build errors required. |
| NFR-10 | Compliance | E-waste disposal log is immutable once written. |
| NFR-11 | Compliance | Data-wipe confirmation is mandatory before disposal record is saved. |

---

## 9. Entity-Relationship (ER) Diagram

```
+-------------------------+
|       departments        |
+-------------------------+
| PK  id          INTEGER |
|     name        TEXT    |
|     created_at  TEXT    |
+----------+--------------+
           | 1
           | has many
           +------------------------------------+
           | N                                  | N
+----------+---------------------------+  +-----+-------------------+
|               users                  |  |        assets           |
+--------------------------------------+  +------------------------+
| PK  id            INTEGER            |  | PK  id            INT  |
|     employee_id   TEXT  UNIQUE       |  |     asset_id      TEXT |
|     name          TEXT               |  |     asset_type    TEXT |
|     email         TEXT  UNIQUE       |  |     serial_number TEXT |
|     password_hash TEXT               |  |     description   TEXT |
|     role          TEXT               |  |     status        TEXT |
|       INVENTORY_MANAGER              |  |       Available        |
|       SIO / JIO / DEPT_USER          |  |       Assigned         |
| FK  department_id  -> departments    |  |       Maintenance      |
|     designation   TEXT               |  |       Disposed         |
|     phone         TEXT               |  | FK  department_id  ->  |
|     is_active     INTEGER            |  |       departments      |
|     created_at    TEXT               |  |     issued_date   TEXT |
|     updated_at    TEXT               |  |     end_of_life_date   |
+---+------------+--------------------+  | FK  created_by -> users|
    |            |                       |     created_at    TEXT |
    | 1          | 1                     |     updated_at    TEXT |
    | submits    | reviews               +----+----+----+---+-----+
    | N          | N                          |    |    |   |
    |            |                    tentative|    |    |   | 1
    |      +-----+------+             service |    |    |   |
    |      | approvals  |                     |    |    |   | disposed by
    |      +------------+                     |    |    |   v N
    |      |PK id       |                     |    |    | +------------------+
    |      |FK request_id -> requests         |    |    | | e_waste_records  |
    |      |   step TEXT|                     |    |    | +------------------+
    |      |     IM Initial Review            |    |    | | PK id            |
    |      |     JIO Approval                 |    |    | | FK asset_id      |
    |      |     SIO Approval                 |    |    | |    disposal_reason|
    |      |     IM Final Processing          |    |    | |    disposal_method|
    |      |     IM Service Processing        |    |    | |    vendor_name   |
    |      |   status (Pending/Approved/      |    |    | |    disposal_date |
    |      |           Rejected)              |    |    | |    data_wiped    |
    |      |FK reviewer_id -> users           |    |    | |    auth_notes    |
    |      |   comments TEXT                  |    |    | | FK disposed_by   |
    |      |   reviewed_at TEXT               |    |    | |    created_at    |
    |      |   created_at  TEXT               |    |    | +------------------+
    |      +-----+------+                     |    |    |
    |            | N                          |    |    |
    |            | 1                          |    |    |
    +------------+----------------------------+    |    |
                 |          requests               |    |
    +------------+---------------------------------+----+----+
    |                       requests                         |
    +--------------------------------------------------------+
    | PK  id                   INTEGER                       |
    |     request_number        TEXT UNIQUE                  |
    | FK  requested_by     ->  users                         |
    | FK  department_id    ->  departments                   |
    |     request_type          TEXT                         |
    |       New Asset / Return / Repair                      |
    |     recipient_type        TEXT                         |
    |       WORKER / NGO / EDUCATION                         |
    |     asset_type            TEXT                         |
    |     quantity              INTEGER                      |
    |     justification         TEXT                         |
    |     status                TEXT                         |
    |       Pending / IM Review / JIO Approved               |
    |       SIO Approved / Issued / Rejected                 |
    |       Returned / Under Repair                          |
    | FK  service_asset_id ->  assets (Return/Repair)        |
    |     service_reason        TEXT                         |
    |     requester_name        TEXT  (worker / contact)     |
    |     requester_employee_id TEXT  (worker only)          |
    |     requester_email       TEXT                         |
    |     requester_designation TEXT  (worker only)          |
    |     requester_phone       TEXT                         |
    |     org_name              TEXT  (NGO/Education only)   |
    |     org_registration_no   TEXT  (NGO/Education only)   |
    |     org_purpose           TEXT  (NGO/Education only)   |
    |     assignment_subtype    TEXT  (loan / donation)      |
    | FK  tentative_asset_id -> assets (IM Step 1)           |
    |     im_notes              TEXT                         |
    | FK  allocated_asset_id -> assets (IM Step 4)           |
    |     allocation_date       TEXT                         |
    |     assigned_to_name      TEXT                         |
    |     condition_on_issue    TEXT                         |
    |     acknowledged          INTEGER (0/1)                |
    |     created_at / updated_at TEXT                       |
    +--------------------------------------------------------+
```

### 9.1 Key Relationships

| Relationship | Cardinality | Description |
|---|---|---|
| departments → users | 1:N | A department has many users |
| departments → assets | 1:N | A department has many assets |
| users → assets (created_by) | 1:N | IM creates many assets |
| users → requests (requested_by) | 1:N | A user submits many requests |
| users → approvals (reviewer_id) | 1:N | A user reviews many approvals |
| requests → approvals | 1:N | A request has multiple approval steps |
| assets → requests (tentative) | 1:N | An asset can be tentatively linked |
| assets → requests (allocated) | 1:1 | An asset is finally allocated to one request |
| assets → requests (service) | 1:N | An asset can be returned/repaired multiple times |
| assets → e_waste_records | 1:1 | A disposed asset has exactly one disposal record |
| users → e_waste_records (disposed_by) | 1:N | IM disposes many assets over time |

---

## 10. Database Schema (Full)

### Table: departments
| Column | Type | Constraint |
|--------|------|------------|
| id | INTEGER | PK AUTOINCREMENT |
| name | TEXT | NOT NULL UNIQUE |
| created_at | TEXT | DEFAULT datetime('now') |

### Table: users
| Column | Type | Constraint |
|--------|------|------------|
| id | INTEGER | PK AUTOINCREMENT |
| employee_id | TEXT | NOT NULL UNIQUE |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL UNIQUE |
| password_hash | TEXT | NOT NULL |
| role | TEXT | CHECK IN (INVENTORY_MANAGER, SIO, JIO, DEPT_USER) |
| department_id | INTEGER | FK -> departments.id |
| designation | TEXT | nullable |
| phone | TEXT | nullable |
| is_active | INTEGER | DEFAULT 1 |
| created_at | TEXT | DEFAULT datetime('now') |
| updated_at | TEXT | DEFAULT datetime('now') |

### Table: assets
| Column | Type | Constraint |
|--------|------|------------|
| id | INTEGER | PK AUTOINCREMENT |
| asset_id | TEXT | NOT NULL UNIQUE |
| asset_type | TEXT | NOT NULL |
| serial_number | TEXT | UNIQUE nullable |
| description | TEXT | nullable |
| status | TEXT | CHECK IN (Available, Assigned, Maintenance, Disposed) |
| department_id | INTEGER | FK -> departments.id |
| issued_date | TEXT | nullable |
| end_of_life_date | TEXT | nullable |
| created_by | INTEGER | NOT NULL FK -> users.id |
| created_at | TEXT | DEFAULT datetime('now') |
| updated_at | TEXT | DEFAULT datetime('now') |

### Table: requests
| Column | Type | Constraint |
|--------|------|------------|
| id | INTEGER | PK AUTOINCREMENT |
| request_number | TEXT | NOT NULL UNIQUE |
| requested_by | INTEGER | NOT NULL FK -> users.id |
| department_id | INTEGER | FK -> departments.id |
| request_type | TEXT | CHECK IN (New Asset, Return, Repair) |
| recipient_type | TEXT | CHECK IN (WORKER, NGO, EDUCATION) nullable |
| asset_type | TEXT | NOT NULL |
| quantity | INTEGER | DEFAULT 1 |
| justification | TEXT | NOT NULL |
| status | TEXT | CHECK IN (Pending, IM Review, JIO Approved, SIO Approved, Issued, Rejected, Returned, Under Repair) |
| service_asset_id | INTEGER | FK -> assets.id |
| service_reason | TEXT | nullable |
| requester_name | TEXT | nullable |
| requester_employee_id | TEXT | nullable (worker only) |
| requester_email | TEXT | nullable |
| requester_designation | TEXT | nullable (worker only) |
| requester_phone | TEXT | nullable |
| org_name | TEXT | nullable (NGO/Education only) |
| org_registration_no | TEXT | nullable (NGO/Education only) |
| org_purpose | TEXT | nullable (NGO/Education only) |
| assignment_subtype | TEXT | CHECK IN (loan, donation) nullable |
| tentative_asset_id | INTEGER | FK -> assets.id |
| im_notes | TEXT | nullable |
| allocated_asset_id | INTEGER | FK -> assets.id |
| allocation_date | TEXT | nullable |
| assigned_to_name | TEXT | nullable |
| condition_on_issue | TEXT | nullable |
| acknowledged | INTEGER | DEFAULT 0 |
| created_at | TEXT | DEFAULT datetime('now') |
| updated_at | TEXT | DEFAULT datetime('now') |

### Table: approvals
| Column | Type | Constraint |
|--------|------|------------|
| id | INTEGER | PK AUTOINCREMENT |
| request_id | INTEGER | NOT NULL FK -> requests.id ON DELETE CASCADE |
| step | TEXT | CHECK IN (IM Initial Review, JIO Approval, SIO Approval, IM Final Processing, IM Service Processing) |
| status | TEXT | CHECK IN (Pending, Approved, Rejected) DEFAULT Pending |
| reviewer_id | INTEGER | FK -> users.id |
| comments | TEXT | nullable |
| reviewed_at | TEXT | nullable |
| created_at | TEXT | DEFAULT datetime('now') |

### Table: e_waste_records
| Column | Type | Constraint |
|--------|------|------------|
| id | INTEGER | PK AUTOINCREMENT |
| asset_id | INTEGER | NOT NULL UNIQUE FK -> assets.id |
| disposal_reason | TEXT | CHECK IN (EOL, Unserviceable, Obsolete, Damaged) NOT NULL |
| disposal_method | TEXT | CHECK IN (Certified Recycler, In-house Shredding, Donation Scrap, Government Handover) NOT NULL |
| vendor_name | TEXT | nullable |
| disposal_date | TEXT | NOT NULL |
| data_wiped | INTEGER | NOT NULL DEFAULT 0 |
| authorisation_notes | TEXT | nullable |
| disposed_by | INTEGER | NOT NULL FK -> users.id |
| created_at | TEXT | DEFAULT datetime('now') |

---

## 11. System Flowcharts

### 11.1 User Authentication Flow

```
         User visits any dashboard URL
                      |
                      v
           Valid session cookie exists?
           /                       \
         NO                        YES
          |                          |
          v                          v
    Redirect to              Extract role from JWT
      /login                          |
          |                           v
          v                  Role allowed for route?
    User enters              /                    \
    email + password       NO                     YES
          |                  |                      |
          v                  v                      v
    Verify bcrypt      Redirect to            Render page
       hash            /login
      /     \
    FAIL    PASS
      |        |
      v        v
   Show    Sign JWT
   error   Set HttpOnly cookie
           Redirect to /dashboard
```

---

### 11.2 New Asset Requisition — Full 4-Step Flow

```
DEPT_USER         SYSTEM          IM               JIO              SIO
    |                |              |                |                |
    |--Fill Form---->|              |                |                |
    |  Recipient:    |              |                |                |
    |  WORKER or     |              |                |                |
    |  NGO/EDUCATION |              |                |                |
    |  Asset Type    |              |                |                |
    |  Justification |              |                |                |
    |                |              |                |                |
    |--Submit------->|              |                |                |
    |                |--Create----->|                |                |
    |                |  Request     |                |                |
    |                |  status=     |                |                |
    |                |  Pending     |                |                |
    |                |  step=IM     |                |                |
    |                |  Initial     |                |                |
    |                |  Review      |                |                |
    |                |              |                |                |
    |                |         [STEP 1]               |                |
    |                |         IM reviews stock       |                |
    |                |         Links tentative asset  |                |
    |                |         Adds notes             |                |
    |                |              |                |                |
    |                |         REJECT?               |                |
    |                |         /      \              |                |
    |                |       YES       NO            |                |
    |                |        |         |            |                |
    |                |  status=     status=IM Review  |                |
    |                |  Rejected    step=JIO Approval |                |
    |                |                  |             |                |
    |                |                  +------------>|                |
    |                |                           [STEP 2]             |
    |                |                           JIO reviews          |
    |                |                           - Request details    |
    |                |                           - IM notes           |
    |                |                           - Tentative asset    |
    |                |                           Writes comments      |
    |                |                               |                |
    |                |                           REJECT?              |
    |                |                           /       \            |
    |                |                         YES        NO          |
    |                |                          |           |         |
    |                |                    status=     status=JIO     |
    |                |                    Rejected    Approved        |
    |                |                                step=SIO       |
    |                |                                Approval        |
    |                |                                    +---------->|
    |                |                                           [STEP 3]
    |                |                                           SIO reviews
    |                |                                           - Full trail
    |                |                                           - Budget check
    |                |                                           Writes comments
    |                |                                               |
    |                |                                           REJECT?
    |                |                                           /       \
    |                |                                         YES        NO
    |                |                                          |           |
    |                |                                    status=     status=SIO
    |                |                                    Rejected    Approved
    |                |                                                step=IM
    |                |              |<--------------------------Final Processing
    |                |         [STEP 4]
    |                |         IM selects exact asset (S/N)
    |                |         Confirms recipient type:
    |                |           WORKER → employee details
    |                |           NGO/EDUCATION → org details
    |                |                      + loan or donation
    |                |         Records condition, EOL, acknowledgement
    |                |              |
    |                |         Issue Asset
    |                |              |
    |                |         asset.status = Assigned
    |                |         asset.issued_date = today
    |                |         asset.eol_date = set
    |                |         request.status = Issued
    |                |              |
    |<--Issued notif--|              |
```

---

### 11.3 Return / Repair Request Flow

```
DEPT_USER              SYSTEM               IM
    |                     |                   |
    |--Select Type------->|                   |
    |  Return or Repair   |                   |
    |  (Repair blocked    |                   |
    |   for donations)    |                   |
    |--Enter Details----->|                   |
    |--Select Asset------>|                   |
    |--Enter Reason------>|                   |
    |--Submit------------>|                   |
    |                     |--Create Request-->|
    |                     |  step=IM Service  |
    |                     |  Processing       |
    |                     |                   |
    |                     |              IM reviews reason
    |                     |              and asset info
    |                     |                   |
    |                     |              REJECT?
    |                     |              /         \
    |                     |            YES          NO
    |                     |             |             |
    |                     |       status=       Request Type?
    |                     |       Rejected      /           \
    |                     |                 RETURN         REPAIR
    |                     |                   |               |
    |                     |            asset.status=   asset.status=
    |                     |            Available       Maintenance
    |                     |            dates cleared
    |                     |            status=         status=
    |                     |            Returned        Under Repair
```

---

### 11.4 E-Waste Disposal Flow

```
IM Dashboard           SYSTEM              E-Waste Log
    |                     |                     |
    | [EOL Alert Panel]   |                     |
    | Asset X is past EOL |                     |
    |                     |                     |
    |--Open Asset-------->|                     |
    |--Initiate Disposal->|                     |
    |                     |                     |
    | Fill Disposal Form: |                     |
    |  - Reason           |                     |
    |  - Method           |                     |
    |  - Vendor (opt)     |                     |
    |  - Disposal Date    |                     |
    |  - Data Wiped? [✓]  |                     |
    |  - Auth Notes       |                     |
    |--Confirm----------->|                     |
    |                     |--Insert------------>|
    |                     |  e_waste_records    |
    |                     |  asset.status=      |
    |                     |  Disposed           |
    |                     |                     |
    |                     | Asset removed from  |
    |                     | active inventory    |
    |                     |                     |
    |--Print E-Waste----->|                     |
    |  Report             |<--Return Report-----|
```

---

### 11.5 Asset Lifecycle State Machine

```
              +----> Available <----+
              |          |          |
    IM adds   |          | IM       | Return
    asset     |          | issues   | approved
              |          v          |
              |       Assigned -----+
              |          |
              |          | Repair request approved
              |          v
              |     Maintenance
              |          |
              |          | IM restores after service
              +----------+
                         |
                         | EOL / Unserviceable / Obsolete / Damaged
                         v
                     [Disposed] ──────────────> E-Waste Record (permanent)
```

---

### 11.6 Role-Based Page Access

```
+-----------------------------------+--------+-----+-----+-----------+
| Page / Feature                    |   IM   | SIO | JIO | DEPT_USER |
+-----------------------------------+--------+-----+-----+-----------+
| Dashboard                         |   YES  | YES | YES |    YES    |
| EOL Alert Panel                   |   YES  |  NO |  NO |     NO    |
| Assets — View                     |   YES  | YES | YES |    YES    |
| Assets — Add / Edit / Delete      |   YES  |  NO |  NO |     NO    |
| Requests — View All               |   YES  | YES | YES | Own only  |
| New Asset Request (Worker)        |    NO  |  NO |  NO |    YES    |
| New Asset Request (NGO/Education) |    NO  |  NO |  NO |    YES    |
| Return / Repair Request           |    NO  |  NO |  NO |    YES    |
| Approvals — Step 1 (IM Init.)     |   YES  |  NO |  NO |     NO    |
| Approvals — Step 2 (JIO)          |    NO  |  NO | YES |     NO    |
| Approvals — Step 3 (SIO)          |    NO  | YES |  NO |     NO    |
| Approvals — Step 4 (IM Final)     |   YES  |  NO |  NO |     NO    |
| Approvals — Service (IM)          |   YES  |  NO |  NO |     NO    |
| E-Waste — Initiate Disposal       |   YES  |  NO |  NO |     NO    |
| E-Waste — Disposal Log            |   YES  |  NO |  NO |     NO    |
| E-Waste — Print Report            |   YES  |  NO |  NO |     NO    |
| Users — View / Manage             |   YES  |  NO |  NO |     NO    |
| Departments                       |   YES  |  NO |  NO |     NO    |
| My Account / Profile              |   YES  | YES | YES |    YES    |
| Print Reports                     |   YES  | YES | YES |    YES    |
+-----------------------------------+--------+-----+-----+-----------+
```

---

## 12. Use Case Summary

### UC-01: Submit Asset Requisition (Worker)
- **Actor:** DEPT_USER
- **Precondition:** Logged in
- **Steps:** Select recipient type = WORKER → fill employee details + asset info → Submit
- **Outcome:** Request created, "Pending", IM Initial Review step created

### UC-02: Submit Asset Requisition (NGO / Education)
- **Actor:** DEPT_USER
- **Precondition:** Logged in
- **Steps:** Select recipient type = NGO or EDUCATION → fill organisation details + purpose + loan/donation → Submit
- **Outcome:** Request created, "Pending", IM Initial Review step created

### UC-03: IM Initial Review (Step 1)
- **Actor:** INVENTORY_MANAGER
- **Steps:** Review stock → link tentative asset → add notes → Forward to JIO
- **Alternate:** Reject → status = Rejected
- **Outcome:** Request = "IM Review", JIO Approval step created

### UC-04: JIO Approval (Step 2)
- **Actor:** JIO
- **Steps:** Review request + IM notes → write comments → Approve
- **Alternate:** Reject → status = Rejected
- **Outcome:** Request = "JIO Approved", SIO Approval step created

### UC-05: SIO Approval (Step 3)
- **Actor:** SIO
- **Steps:** Review request + full trail → write comments → Approve
- **Alternate:** Reject → status = Rejected
- **Outcome:** Request = "SIO Approved", IM Final Processing step created

### UC-06: IM Final Processing — Asset Issuance (Step 4)
- **Actor:** INVENTORY_MANAGER
- **Steps:** Select asset (S/N visible) → confirm recipient type → fill recipient details, condition, EOL → check acknowledgement → Issue
- **Outcome:** Asset = Assigned; Request = Issued; EOL recorded

### UC-07: Submit Return Request
- **Actor:** DEPT_USER
- **Steps:** Select Return → pick Assigned asset → enter reason → Submit → IM approves
- **Outcome:** Asset = Available; Request = Returned

### UC-08: Submit Repair Request
- **Actor:** DEPT_USER
- **Precondition:** Asset is not a permanent donation
- **Steps:** Select Repair → pick Assigned asset → describe issue → Submit → IM approves
- **Outcome:** Asset = Maintenance; Request = Under Repair

### UC-09: E-Waste Disposal
- **Actor:** INVENTORY_MANAGER
- **Precondition:** Asset is at or past EOL, or deemed unserviceable
- **Steps:** Open asset from EOL Alert panel → Initiate E-Waste Disposal → fill disposal form (reason, method, vendor, date, data-wipe confirmation) → Confirm
- **Outcome:** Asset = Disposed; e_waste_records row created; asset removed from active inventory

---

## 13. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 (App Router) |
| Bundler | Turbopack |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite via better-sqlite3 |
| Authentication | JWT via jose (SignJWT / jwtVerify) |
| Password Hashing | bcryptjs (cost factor 10) |
| Icons | lucide-react |
| Server Actions | Next.js "use server" |
| Session Storage | HttpOnly cookie named "session" |
| Deployment | Node.js (npm run start) |

---

*End of SRS Document — Asset-IT v3.0*
