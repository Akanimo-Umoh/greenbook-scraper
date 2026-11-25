import { readdir, readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import type { Medicine } from "./buildMedicines.ts";
import { decodeEntities, normaliseNafdac } from "./text.ts";

const REPORT_URL =
  "https://github.com/Akanimo-Umoh/greenbook-scraper/blob/main/reports/quality-report-latest.md";

async function latestMedicinesFile(): Promise<string> {
  const files = (await readdir("data"))
    .filter((name) => name.startsWith("medicines-") && name.endsWith(".json"))
    .sort();
  if (files.length === 0)
    throw new Error("No medicines file found. Run `pnpm medicines` first.");
  return `data/${files[files.length - 1]}`;
}

const sourcePath = await latestMedicinesFile();
const { fetchedAt, medicines } = JSON.parse(
  await readFile(sourcePath, "utf-8"),
) as {
  fetchedAt: string;
  medicines: Medicine[];
};
const dataDate = fetchedAt.slice(0, 10);

const workbook = new ExcelJS.Workbook();
workbook.created = new Date();

// Styles the header row and freezes it, so it stays visible while scrolling.
function styleSheet(sheet: ExcelJS.Worksheet): void {
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2F1E8" },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };
}

// ---------- Tab 1: Medicines ----------
const medSheet = workbook.addWorksheet("Medicines");
medSheet.columns = [
  { header: "Product ID", key: "id", width: 11 },
  // style.numFmt "@" means "text", so Excel will never turn 04-7953 into a date.
  { header: "NAFDAC No.", key: "nafdac", width: 14, style: { numFmt: "@" } },
  { header: "Product name", key: "name", width: 45 },
  { header: "Active ingredient(s)", key: "ingredient", width: 35 },
  { header: "Strength", key: "strength", width: 18 },
  { header: "Form", key: "form", width: 16 },
  { header: "Route", key: "route", width: 14 },
  { header: "Pack size", key: "pack", width: 30 },
  { header: "Applicant", key: "applicant", width: 35 },
  { header: "Status", key: "status", width: 16 },
  {
    header: "Approval date",
    key: "approved",
    width: 13,
    style: { numFmt: "@" },
  },
  { header: "Expiry date", key: "expiry", width: 13, style: { numFmt: "@" } },
  { header: "ATC code", key: "atc", width: 11 },
  { header: "Category", key: "category", width: 10 },
  { header: "Product name as stored by NAFDAC", key: "rawName", width: 45 },
  { header: "Quality notes", key: "notes", width: 50 },
];
for (const m of medicines) {
  medSheet.addRow({
    id: m.productId,
    nafdac: m.nafdacNo.trim(),
    name: m.productNameDisplay,
    ingredient: decodeEntities(m.activeIngredient),
    strength: decodeEntities(m.strength),
    form: m.form,
    route: m.route,
    pack: decodeEntities(m.packSize),
    applicant: m.applicantDisplay,
    status: m.status,
    approved: m.approvalDate,
    expiry: m.expiryDate,
    atc: m.atcCode,
    category: m.category,
    rawName: m.productName,
    notes: m.qualityNotes.join("; "),
  });
}
styleSheet(medSheet);

// ---------- Tab 2: Shared NAFDAC numbers ----------
const groups = new Map<string, Medicine[]>();
for (const m of medicines) {
  const key = normaliseNafdac(m.nafdacNo);
  if (!key) continue;
  groups.set(key, [...(groups.get(key) ?? []), m]);
}
const shared = [...groups.entries()]
  .filter(([, list]) => list.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

const sharedSheet = workbook.addWorksheet("Shared NAFDAC numbers");
sharedSheet.columns = [
  { header: "NAFDAC No.", key: "nafdac", width: 14, style: { numFmt: "@" } },
  { header: "Records sharing it", key: "count", width: 10 },
  { header: "Product ID", key: "id", width: 11 },
  { header: "Product name", key: "name", width: 45 },
  { header: "Strength", key: "strength", width: 18 },
  { header: "Applicant", key: "applicant", width: 35 },
  { header: "Status", key: "status", width: 16 },
];
for (const [number, list] of shared) {
  for (const m of list) {
    sharedSheet.addRow({
      nafdac: number,
      count: list.length,
      id: m.productId,
      name: m.productNameDisplay,
      strength: decodeEntities(m.strength),
      applicant: m.applicantDisplay,
      status: m.status,
    });
  }
}
styleSheet(sharedSheet);

// ---------- Tab 3: About this data ----------
const about = workbook.addWorksheet("About");
about.columns = [{ width: 32 }, { width: 70 }];
about.addRows([
  ["Source", "NAFDAC Greenbook, https://greenbook.nafdac.gov.ng/"],
  ["Downloaded", fetchedAt],
  ["Medicines", medicines.length],
  [
    "Shared NAFDAC numbers",
    `${shared.length} numbers, ${shared.reduce((s, [, l]) => s + l.length, 0)} records`,
  ],
  [
    "Editing",
    "Values are as NAFDAC published them. Only display names hide # and * marks, as the Greenbook site does.",
  ],
  ["Full written report", "Open the quality report"],
]);
about.getColumn(1).font = { bold: true };

// Turn the last row's second cell into a clickable link.
const linkCell = about.getCell(`B${about.rowCount}`);
linkCell.value = { text: "Open the quality report", hyperlink: REPORT_URL };
linkCell.font = { color: { argb: "FF0B5D45" }, underline: true };

// ---------- Save ----------
const outPath = `data/checkam-medicines-${dataDate}.xlsx`;
try {
  await workbook.xlsx.writeFile(outPath);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "EBUSY") {
    console.error(`${outPath} is open in Excel. Close it and run again.`);
    process.exit(1);
  }
  throw error;
}
console.log(`Saved ${outPath}`);
console.log(`  Medicines tab:      ${medicines.length} rows`);
console.log(`  Shared numbers tab: ${shared.length} numbers`);
