PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS departments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id   TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('INVENTORY_MANAGER','SIO','JIO','DEPT_USER')),
  department_id INTEGER REFERENCES departments(id),
  designation   TEXT,
  phone         TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assets (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id         TEXT    NOT NULL UNIQUE,
  asset_type       TEXT    NOT NULL,
  serial_number    TEXT    UNIQUE,
  description      TEXT,
  status           TEXT    NOT NULL DEFAULT 'Available'
                   CHECK (status IN ('Available','Assigned','Maintenance')),
  department_id    INTEGER REFERENCES departments(id),
  issued_date      TEXT,
  end_of_life_date TEXT,
  created_by       INTEGER NOT NULL REFERENCES users(id),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department_id);

CREATE TABLE IF NOT EXISTS requests (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  request_number      TEXT    NOT NULL UNIQUE,
  requested_by        INTEGER NOT NULL REFERENCES users(id),
  department_id       INTEGER REFERENCES departments(id),
  request_type        TEXT    NOT NULL DEFAULT 'New Asset'
                      CHECK (request_type IN ('New Asset','Return','Repair','External Issuance')),
  asset_type          TEXT    NOT NULL DEFAULT '',
  quantity            INTEGER NOT NULL DEFAULT 1,
  justification       TEXT    NOT NULL DEFAULT '',
  status              TEXT    NOT NULL DEFAULT 'Pending'
                      CHECK (status IN ('Pending','IM Review','JIO Approved','SIO Approved','Issued','Rejected','Returned','Under Repair')),
  -- For Return/Repair requests
  service_asset_id    INTEGER REFERENCES assets(id),
  service_reason      TEXT,
  -- Worker/requester contact details (entered by the request head)
  requester_name        TEXT,
  requester_employee_id TEXT,
  requester_email       TEXT,
  requester_designation TEXT,
  requester_phone       TEXT,
  -- IM Initial Check fields
  tentative_asset_id  INTEGER REFERENCES assets(id),
  im_notes            TEXT,
  -- Final Issuance fields
  allocated_asset_id  INTEGER REFERENCES assets(id),
  allocation_date     TEXT,
  assigned_to_name    TEXT,
  condition_on_issue  TEXT,
  acknowledged        INTEGER NOT NULL DEFAULT 0,
  -- External issuance fields (NGO / School)
  issue_to_type       TEXT NOT NULL DEFAULT 'Internal'
                      CHECK (issue_to_type IN ('Internal','NGO','School')),
  issue_to_org_name   TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_by ON requests(requested_by);

CREATE TABLE IF NOT EXISTS approvals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id  INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  step        TEXT    NOT NULL CHECK (step IN ('IM Initial Review','JIO Approval','SIO Approval','IM Final Processing','IM Service Processing')),
  status      TEXT    NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  reviewer_id INTEGER REFERENCES users(id),
  comments    TEXT,
  reviewed_at TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_approvals_request ON approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_approvals_step ON approvals(step, status);
