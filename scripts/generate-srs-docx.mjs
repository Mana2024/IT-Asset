import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, UnderlineType
} from "docx";
import { readFileSync, writeFileSync } from "fs";

const md = readFileSync("SRS.md", "utf-8");
const lines = md.split("\n");

function cell(text, bold = false, shade = false) {
  return new TableCell({
    shading: shade ? { fill: "D9E1F2" } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text: text ?? "", bold, size: 20 })],
    })],
  });
}

function makeTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideH: { style: BorderStyle.SINGLE, size: 1 },
      insideV: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: rows.map((row, ri) =>
      new TableRow({
        children: row.map((c) => cell(c, ri === 0, ri === 0)),
      })
    ),
  });
}

const children = [];

let tableBuffer = [];
let inTable = false;
let inCode = false;
let codeLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Code block
  if (line.startsWith("```")) {
    if (!inCode) {
      inCode = true;
      codeLines = [];
    } else {
      inCode = false;
      children.push(new Paragraph({
        children: [new TextRun({
          text: codeLines.join("\n"),
          font: "Courier New",
          size: 18,
        })],
        spacing: { before: 100, after: 200 },
      }));
      codeLines = [];
    }
    continue;
  }
  if (inCode) { codeLines.push(line); continue; }

  // Table rows
  if (line.startsWith("|")) {
    const cols = line.split("|").slice(1, -1).map((c) => c.trim());
    // skip separator rows like |---|---|
    if (!cols.every((c) => /^[-: ]+$/.test(c))) {
      tableBuffer.push(cols);
    }
    inTable = true;
    continue;
  } else if (inTable) {
    if (tableBuffer.length > 0) children.push(makeTable(tableBuffer));
    tableBuffer = [];
    inTable = false;
  }

  // Headings
  if (line.startsWith("### ")) {
    children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 300, after: 100 } }));
    continue;
  }
  if (line.startsWith("## ")) {
    children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 150 } }));
    continue;
  }
  if (line.startsWith("# ")) {
    children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    continue;
  }

  // HR
  if (line.startsWith("---")) {
    children.push(new Paragraph({ text: "", spacing: { before: 200, after: 200 } }));
    continue;
  }

  // Bullet list
  if (line.startsWith("- ")) {
    children.push(new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: line.slice(2), size: 22 })],
    }));
    continue;
  }

  // Bold line like **key**: value
  const boldMatch = line.match(/^\*\*(.+?)\*\*\s*(.*)$/);
  if (boldMatch) {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: boldMatch[1], bold: true, size: 22 }),
        new TextRun({ text: " " + boldMatch[2], size: 22 }),
      ],
    }));
    continue;
  }

  // Normal paragraph
  if (line.trim()) {
    children.push(new Paragraph({
      children: [new TextRun({ text: line.replace(/\*\*/g, ""), size: 22 })],
      spacing: { after: 80 },
    }));
  } else {
    children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
  }
}

if (tableBuffer.length > 0) children.push(makeTable(tableBuffer));

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
      },
    },
    children,
  }],
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
  },
});

const buf = await Packer.toBuffer(doc);
writeFileSync("SRS.docx", buf);
console.log("SRS.docx created successfully.");
