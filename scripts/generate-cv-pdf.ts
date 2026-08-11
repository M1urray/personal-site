/**
 * Generates public/Robert_Njonjo_CV.pdf from the shared resume data.
 * Run with: pnpm cv:pdf   (Node runs this .ts file directly via type-stripping.)
 */
import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { summary, skills, roles } from "../lib/resume.ts";
import { siteConfig } from "../lib/site.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "..", "public", "Robert_Njonjo_CV.pdf");
mkdirSync(dirname(outPath), { recursive: true });

const INK = "#0A1017";
const STEEL = "#6B8299";
const AMBER = "#C6802A"; // darker amber — readable as small text on white
const AMBER_RULE = "#F0A63C";
const TEXT = "#25333F";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 54, bottom: 56, left: 56, right: 56 },
  bufferPages: true,
  info: {
    Title: "Robert Kamau Njonjo — CV",
    Author: siteConfig.name,
    Subject: siteConfig.role,
  },
});
doc.pipe(createWriteStream(outPath));

const left = doc.page.margins.left;
const right = doc.page.width - doc.page.margins.right;
const contentW = right - left;
const bottomLimit = () => doc.page.height - doc.page.margins.bottom;

function hr(color: string, width: number) {
  const y = doc.y;
  doc
    .moveTo(left, y)
    .lineTo(right, y)
    .lineWidth(width)
    .strokeColor(color)
    .stroke();
}

function sectionLabel(label: string) {
  doc.moveDown(0.9);
  if (doc.y > bottomLimit() - 60) doc.addPage();
  doc
    .font("Courier-Bold")
    .fontSize(9)
    .fillColor(AMBER)
    .text(label.toUpperCase(), { characterSpacing: 1 });
  doc.moveDown(0.45);
}

// ---- Header -----------------------------------------------------------------
doc
  .font("Helvetica-Bold")
  .fontSize(24)
  .fillColor(INK)
  .text("Robert Kamau Njonjo");
doc.moveDown(0.3);
doc
  .font("Helvetica")
  .fontSize(10.5)
  .fillColor(STEEL)
  .text(`${siteConfig.role}   ·   ${siteConfig.location}`);
doc.moveDown(0.35);
doc
  .font("Courier")
  .fontSize(9)
  .fillColor(STEEL)
  .text(
    `${siteConfig.email}    ${siteConfig.phoneDisplay}    ${siteConfig.links.linkedinHandle}    ${siteConfig.links.githubHandle}`,
  );
doc.moveDown(0.7);
hr(AMBER_RULE, 2);

// ---- Summary ----------------------------------------------------------------
sectionLabel("Summary");
doc.font("Helvetica").fontSize(10).fillColor(TEXT);
for (const para of summary) {
  doc.text(para, { width: contentW, lineGap: 2 });
  doc.moveDown(0.5);
}

// ---- Skills -----------------------------------------------------------------
sectionLabel("Skills");
for (const skill of skills) {
  if (doc.y > bottomLimit() - 26) doc.addPage();
  doc
    .font("Courier-Bold")
    .fontSize(9)
    .fillColor(AMBER)
    .text(`${skill.label.toUpperCase()}   `, { continued: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(TEXT).text(skill.value, {
    width: contentW,
    lineGap: 1.5,
  });
  doc.moveDown(0.4);
}

// ---- Experience -------------------------------------------------------------
sectionLabel("Experience");
for (const role of roles) {
  if (doc.y > bottomLimit() - 110) doc.addPage();

  const rowY = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(INK)
    .text(role.org, left, rowY, { width: contentW - 130 });
  doc
    .font("Courier")
    .fontSize(8.5)
    .fillColor(STEEL)
    .text(role.when, left, rowY + 2, { width: contentW, align: "right" });

  doc.moveDown(0.15);
  doc
    .font("Courier")
    .fontSize(9)
    .fillColor(AMBER)
    .text(role.title, left, doc.y);
  doc.moveDown(0.45);

  doc.font("Helvetica").fontSize(9.5).fillColor(TEXT);
  doc.list(role.bullets, left, doc.y, {
    bulletRadius: 1.3,
    textIndent: 12,
    bulletIndent: 0,
    lineGap: 1.5,
    width: contentW,
  });

  doc.moveDown(0.5);
  doc
    .font("Courier")
    .fontSize(8)
    .fillColor(STEEL)
    .text(role.stack.join("   ·   "), { width: contentW });
  doc.moveDown(0.9);
}

// ---- Footers (page numbers) -------------------------------------------------
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  // Drop the bottom margin so drawing in the footer band doesn't paginate.
  doc.page.margins.bottom = 0;
  const y = doc.page.height - 40;
  doc.font("Courier").fontSize(8).fillColor(STEEL);
  doc.text("ROBERT KAMAU NJONJO — CV", left, y, { lineBreak: false });
  doc.text(`PAGE ${i - range.start + 1} OF ${range.count}`, left, y, {
    width: contentW,
    align: "right",
    lineBreak: false,
  });
}

doc.end();
console.log(`CV written to ${outPath}`);
