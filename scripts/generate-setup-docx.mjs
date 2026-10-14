import {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType
} from "docx";
import { writeFileSync } from "fs";

const BLUE        = "1e40af";
const LIGHT_BLUE  = "dbeafe";
const GRAY        = "6b7280";
const LIGHT_GRAY  = "f3f4f6";
const WHITE       = "ffffff";
const BLACK       = "111827";
const GREEN       = "065f46";
const LIGHT_GREEN = "d1fae5";
const WIN_BG      = "eff6ff";
const WIN_BORDER  = "93c5fd";
const WIN_LABEL   = "1d4ed8";
const MAC_BG      = "f0fdf4";
const MAC_BORDER  = "86efac";
const MAC_LABEL   = "166534";
const CODE_BG     = "f8fafc";

// ── Helpers ────────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    spacing: { before: 480, after: 160 },
    shading: { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
    children: [new TextRun({ text: `  ${text}`, color: WHITE, bold: true, size: 30 })],
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 320, after: 100 },
    children: [new TextRun({ text, color: BLUE, bold: true, size: 24 })],
    border: { bottom: { color: LIGHT_BLUE, size: 6, space: 4, style: BorderStyle.SINGLE } },
  });
}

function h3(text, color = BLACK) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, color, bold: true, size: 22 })],
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, color: BLACK, size: 20 })],
  });
}

function note(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    shading: { type: ShadingType.SOLID, color: LIGHT_GREEN, fill: LIGHT_GREEN },
    children: [new TextRun({ text: `ℹ  ${text}`, color: GREEN, size: 18, italics: true })],
  });
}

function warn(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    shading: { type: ShadingType.SOLID, color: "fef9c3", fill: "fef9c3" },
    children: [new TextRun({ text: `⚠  ${text}`, color: "92400e", size: 18, italics: true })],
  });
}

function bullet(boldPart, rest = "") {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: boldPart, bold: !!rest, size: 20, color: BLACK }),
      ...(rest ? [new TextRun({ text: rest, size: 20, color: BLACK })] : []),
    ],
  });
}

function subbullet(boldPart, rest = "") {
  return new Paragraph({
    bullet: { level: 1 },
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: boldPart, bold: !!rest, size: 20, color: BLACK }),
      ...(rest ? [new TextRun({ text: rest, size: 20, color: BLACK })] : []),
    ],
  });
}

function gap(size = 80) {
  return new Paragraph({ text: "", spacing: { before: size, after: size } });
}

// OS section header banner
function osBanner(label, isWin) {
  const bg = isWin ? "1d4ed8" : "15803d";
  const icon = isWin ? "🪟  Windows — Command Prompt" : "🍎  Mac — Terminal";
  return new Paragraph({
    spacing: { before: 240, after: 0 },
    shading: { type: ShadingType.SOLID, color: bg, fill: bg },
    children: [new TextRun({ text: `  ${icon}  (${label})`, color: WHITE, bold: true, size: 20 })],
  });
}

// A single copyable command line
function cmd(text, isWin = true) {
  const bg     = isWin ? WIN_BG    : MAC_BG;
  const border = isWin ? WIN_BORDER: MAC_BORDER;
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { type: ShadingType.SOLID, color: bg, fill: bg },
    border: { left: { color: border, size: 12, space: 6, style: BorderStyle.SINGLE } },
    children: [new TextRun({ text: `  ${text}`, font: "Courier New", size: 20, color: "1f2937" })],
  });
}

// A comment line inside a command block (lighter, italic)
function cmdComment(text, isWin = true) {
  const bg = isWin ? WIN_BG : MAC_BG;
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { type: ShadingType.SOLID, color: bg, fill: bg },
    children: [new TextRun({ text: `  ${text}`, font: "Courier New", size: 18, color: GRAY, italics: true })],
  });
}

function cmdEnd(isWin = true) {
  return new Paragraph({ spacing: { before: 0, after: 100 }, shading: { type: ShadingType.SOLID, color: isWin ? WIN_BG : MAC_BG, fill: isWin ? WIN_BG : MAC_BG }, text: "" });
}

// Plain code block (not OS-specific)
function code(text) {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { type: ShadingType.SOLID, color: CODE_BG, fill: CODE_BG },
    border: { left: { color: "94a3b8", size: 12, space: 6, style: BorderStyle.SINGLE } },
    children: [new TextRun({ text: `  ${text}`, font: "Courier New", size: 20, color: "1f2937" })],
  });
}
function codeEnd() {
  return new Paragraph({ spacing: { before: 0, after: 100 }, shading: { type: ShadingType.SOLID, color: CODE_BG, fill: CODE_BG }, text: "" });
}

function tableHeader(cells) {
  return new TableRow({
    tableHeader: true,
    children: cells.map(t => new TableCell({
      shading: { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: t, color: WHITE, bold: true, size: 18 })] })],
    })),
  });
}

function tableRow(cells, shade = false) {
  return new TableRow({
    children: cells.map(t => new TableCell({
      shading: shade ? { type: ShadingType.SOLID, color: LIGHT_GRAY, fill: LIGHT_GRAY } : undefined,
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: t, size: 18, color: BLACK })] })],
    })),
  });
}

// ── Document ───────────────────────────────────────────────────────────────

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 900, bottom: 900, left: 1080, right: 1080 } } },
    children: [

      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "IT-Asset System", color: WHITE, bold: true, size: 56 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "Setup & Installation Guide", color: LIGHT_BLUE, size: 28 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
        spacing: { before: 0, after: 500 },
        children: [new TextRun({ text: "Government of Meghalaya — IT Asset Management", color: LIGHT_BLUE, size: 20, italics: true })],
      }),

      // ── SECTION 1: Quick Setup ──────────────────────────────────────────
      h1("1. Quick Setup — Copy & Run These Commands"),
      body("Follow the steps below in order. Each command can be copied directly from this document."),
      body("First, open your terminal:"),
      bullet("Windows:", "  Press  Win + R,  type  cmd,  press Enter"),
      bullet("Mac:", "  Press  Command ⌘ + Space,  type  Terminal,  press Enter"),
      gap(),

      h2("Step 1 — Navigate to the project folder"),

      osBanner("paste your actual path", true),
      cmd(`cd C:\\Users\\YourName\\Desktop\\it-asset`, true),
      cmdEnd(true),

      osBanner("paste your actual path", false),
      cmd(`cd ~/Desktop/it-asset`, false),
      cmdEnd(false),

      h2("Step 2 — Install dependencies"),

      osBanner("run once", true),
      cmd(`npm install`, true),
      cmdEnd(true),

      osBanner("run once", false),
      cmd(`npm install`, false),
      cmdEnd(false),

      h2("Step 3 — Generate a secure SESSION_SECRET"),
      body("Copy the output and paste it into .env.local as SESSION_SECRET (see Section 3)."),

      osBanner("copy output", true),
      cmd(`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`, true),
      cmdEnd(true),

      osBanner("copy output", false),
      cmd(`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`, false),
      cmdEnd(false),

      h2("Step 4 — Start the application"),

      osBanner("development mode", true),
      cmd(`npm run dev`, true),
      cmdEnd(true),

      osBanner("development mode", false),
      cmd(`npm run dev`, false),
      cmdEnd(false),

      body("Then open a browser and go to:  http://localhost:3000"),
      note("Keep the terminal window open while the app is running. Closing it stops the server."),
      gap(),

      h2("Step 5 — Build & run in production (when going live)"),

      osBanner("production", true),
      cmd(`npm run build`, true),
      cmd(`npm start`, true),
      cmdEnd(true),

      osBanner("production", false),
      cmd(`npm run build`, false),
      cmd(`npm start`, false),
      cmdEnd(false),

      // ── SECTION 2: Install Node.js ──────────────────────────────────────
      h1("2. Installing Node.js (if not already installed)"),
      body("Node.js is required to run the application. Install version 18 or later."),
      gap(),

      h2("Check if Node.js is already installed"),
      body("Run this in your terminal. If you see a version number you are good to go."),

      osBanner("should print v18.x.x or higher", true),
      cmd(`node --version`, true),
      cmd(`npm --version`, true),
      cmdEnd(true),

      osBanner("should print v18.x.x or higher", false),
      cmd(`node --version`, false),
      cmd(`npm --version`, false),
      cmdEnd(false),

      h2("Windows — Install Node.js"),
      body("Option A (recommended) — Download from the official website:"),
      bullet("Go to  https://nodejs.org"),
      bullet('Click "Download Node.js (LTS)"  and run the .msi installer'),
      bullet("Keep all default options and restart your computer after"),
      gap(),
      body("Option B — Using winget (Windows 10/11 built-in):"),
      osBanner("run as Administrator", true),
      cmd(`winget install OpenJS.NodeJS.LTS`, true),
      cmdEnd(true),

      h2("Mac — Install Node.js"),
      body("Option A (recommended) — Download from the official website:"),
      bullet("Go to  https://nodejs.org"),
      bullet('Click "Download Node.js (LTS)"  and run the .pkg installer'),
      gap(),
      body("Option B — Using Homebrew:"),
      osBanner("install Homebrew first if needed: https://brew.sh", false),
      cmd(`brew install node`, false),
      cmdEnd(false),

      // ── SECTION 3: .env.local ───────────────────────────────────────────
      h1("3. Configure the .env.local File"),
      body("Open .env.local in the project root with any text editor (Notepad on Windows, TextEdit on Mac) and fill in the values below. Replace the placeholder text with real values."),
      gap(),

      code(`SESSION_SECRET=paste-the-output-from-step-3-above`),
      code(`DATABASE_PATH=./data/it-asset.db`),
      code(`EOL_WARN_DAYS=90,30,7,1`),
      code(`SMTP_HOST=smtp.gmail.com`),
      code(`SMTP_USER=your-gmail@gmail.com`),
      code(`SMTP_PASS=your-16-char-app-password`),
      code(`SMTP_FROM=your-gmail@gmail.com`),
      code(`NEXT_PUBLIC_BASE_URL=http://localhost:3000`),
      codeEnd(),

      h2("Gmail App Password (SMTP_PASS)"),
      body("This allows the system to send password reset emails. It is NOT your Gmail login password."),
      gap(),
      bullet("1.", "  Go to  myaccount.google.com"),
      bullet("2.", "  Security  →  2-Step Verification  →  turn it ON"),
      bullet("3.", "  Security  →  App Passwords  (only visible after 2FA is on)"),
      bullet("4.", '  App: Mail   Device: Other   Name it "IT-Asset"   →  Generate'),
      bullet("5.", "  Copy the 16-character password  →  paste as SMTP_PASS"),
      gap(),
      note("If you do not set up SMTP, the app still works — only the Forgot Password email feature will not send."),
      gap(),

      h2("NEXT_PUBLIC_BASE_URL"),
      bullet("Running locally:", "  http://localhost:3000"),
      bullet("On a server:", "  http://192.168.x.x:3000   (use the server machine's IP address)"),
      gap(),

      // ── SECTION 4: Default Accounts ─────────────────────────────────────
      h1("4. Default Login Accounts"),
      body("These accounts are pre-loaded in the database and ready to use:"),
      gap(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          tableHeader(["Role", "Email", "Default Password"]),
          tableRow(["Inventory Manager", "im@nitm.ac.in", "Admin@123"], false),
          tableRow(["SIO (Senior Inspecting Officer)", "sio@nitm.ac.in", "Admin@123"], true),
          tableRow(["JIO (Junior Inspecting Officer)", "jio@nitm.ac.in", "Admin@123"], false),
          tableRow(["Department User", "head@nitm.ac.in", "Admin@123"], true),
        ],
      }),
      gap(),
      warn("Change all passwords immediately after first login — Account → Change Password in the sidebar."),
      gap(),

      // ── SECTION 5: Creating Users ────────────────────────────────────────
      h1("5. Creating New User Accounts"),
      body("Only the Inventory Manager can create accounts:"),
      bullet("Log in as im@nitm.ac.in"),
      bullet("Go to  Users  in the left sidebar  →  New User"),
      bullet("Fill in name, email, password, role, and department"),
      gap(),
      body("Roles:"),
      subbullet("INVENTORY_MANAGER", " — full access: assets, issuance, users, reports"),
      subbullet("SIO", " — approves requests at the Senior Inspecting Officer step"),
      subbullet("JIO", " — reviews requests at the Junior Inspecting Officer step"),
      subbullet("DEPT_USER", " — department staff who submit asset requisitions"),
      gap(),

      // ── SECTION 6: Database Backup ───────────────────────────────────────
      h1("6. Database Backup"),
      body("The entire database is a single file:  data/it-asset.db"),
      body("To create a dated backup copy:"),

      osBanner("run from inside the project folder", true),
      cmd(`copy data\\it-asset.db data\\backup-%date:~10,4%%date:~4,2%%date:~7,2%.db`, true),
      cmdEnd(true),

      osBanner("run from inside the project folder", false),
      cmd(`cp data/it-asset.db data/backup-$(date +%Y%m%d).db`, false),
      cmdEnd(false),

      note("Back up daily once the system is in use. The entire system state is in this one file."),
      gap(),

      // ── SECTION 7: Permissions ───────────────────────────────────────────
      h1("7. Roles & Permissions Reference"),
      gap(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          tableHeader(["Feature", "Inv. Manager", "SIO", "JIO", "Dept User"]),
          tableRow(["View assets",            "✓", "✓", "✓", "✓"], false),
          tableRow(["Add / edit assets",       "✓", "",  "",  "" ], true),
          tableRow(["Submit requisitions",     "✓", "✓", "✓", "✓"], false),
          tableRow(["IM initial review",       "✓", "",  "",  "" ], true),
          tableRow(["JIO approval",            "",  "",  "✓", "" ], false),
          tableRow(["SIO approval",            "",  "✓", "",  "" ], true),
          tableRow(["Issue / allocate assets", "✓", "",  "",  "" ], false),
          tableRow(["Condemn assets",          "✓", "",  "",  "" ], true),
          tableRow(["Manage users",            "✓", "",  "",  "" ], false),
          tableRow(["Manage employees",        "✓", "",  "",  "✓"], true),
          tableRow(["View reports",            "✓", "✓", "✓", "" ], false),
        ],
      }),
      gap(),

      // Footer
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480 },
        shading: { type: ShadingType.SOLID, color: LIGHT_GRAY, fill: LIGHT_GRAY },
        children: [new TextRun({ text: "IT-Asset System  ·  Government of Meghalaya  ·  IT Asset Management", color: GRAY, size: 16, italics: true })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  writeFileSync("SETUP.docx", buf);
  console.log("SETUP.docx generated");
});
