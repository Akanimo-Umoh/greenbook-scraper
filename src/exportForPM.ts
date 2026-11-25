import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import type { Medicine } from "./buildMedicines.ts"; // "import type" brings in only the type, it doesn't run that script
import { decodeEntities, isEmptyValue, normaliseNafdac } from "./text.ts";

// Writes a file, with a clear message if Excel (or another program) has it open.
async function safeWrite(path: string, content: string): Promise<void> {
  try {
    await writeFile(path, content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EBUSY") {
      console.error(
        `\n${path} is open in another program (probably Excel). Close it and run again.`,
      );
      process.exit(1);
    }
    throw error;
  }
}

// ---------- Load the newest medicines file ----------
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
const today = new Date().toISOString().slice(0, 10);
console.log(`Reading ${sourcePath} (${medicines.length} medicines)...\n`);

// ---------- CSV helpers ----------
// A cell containing a comma, quote or line break must be wrapped in quotes,
// and any quote inside it doubled. Otherwise the columns shift in Excel.
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  // "\uFEFF" at the start tells Excel the file is UTF-8, so characters like "é" show correctly.
  return (
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
  );
}

// ---------- 1. The main spreadsheet ----------
// Each entry: [column title, how to get the value from a medicine]
const COLUMNS: [string, (m: Medicine) => unknown][] = [
  ["Product ID", (m) => m.productId],
  ["NAFDAC No.", (m) => m.nafdacNo.trim()],
  ["Product name", (m) => m.productNameDisplay],
  ["Active ingredient(s)", (m) => decodeEntities(m.activeIngredient)],
  ["Strength", (m) => decodeEntities(m.strength)],
  ["Form", (m) => m.form],
  ["Route", (m) => m.route],
  ["Pack size", (m) => decodeEntities(m.packSize)],
  ["Applicant", (m) => m.applicantDisplay],
  ["Status", (m) => m.status],
  ["Approval date", (m) => m.approvalDate],
  ["Expiry date", (m) => m.expiryDate],
  ["ATC code", (m) => m.atcCode],
  ["Category", (m) => m.category],
  ["Product name as stored by NAFDAC", (m) => m.productName],
  ["Quality notes", (m) => m.qualityNotes.join("; ")],
];

const mainCsvPath = `data/medicines-${dataDate}.csv`;
await safeWrite(
  mainCsvPath,
  toCsv(
    COLUMNS.map(([title]) => title),
    medicines.map((m) => COLUMNS.map(([, get]) => get(m))),
  ),
);
console.log(`Spreadsheet saved: ${mainCsvPath}`);

// ---------- 2. Empty cells per column ----------
const FIELDS_TO_CHECK: [string, keyof Medicine][] = [
  ["NAFDAC No.", "nafdacNo"],
  ["Product name", "productName"],
  ["Active ingredient(s)", "activeIngredient"],
  ["Synonym", "synonym"],
  ["Strength", "strength"],
  ["Form", "form"],
  ["Route", "route"],
  ["Pack size", "packSize"],
  ["Composition", "composition"],
  ["ATC code", "atcCode"],
  ["Applicant", "applicant"],
  ["Approval date", "approvalDate"],
  ["Expiry date", "expiryDate"],
  ["SmPC link", "smpc"],
];

const emptyCounts = FIELDS_TO_CHECK.map(([label, key]) => ({
  column: label,
  empty: medicines.filter((m) => isEmptyValue(m[key])).length,
})).sort((a, b) => b.empty - a.empty);

console.log("\nEmpty cells per column (blank, NA, nil... all count as empty):");
console.table(emptyCounts);

// ---------- 3. NAFDAC numbers used by more than one record ----------
const groups = new Map<string, Medicine[]>();
for (const m of medicines) {
  const key = normaliseNafdac(m.nafdacNo);
  if (!key) continue; // missing numbers are counted separately below
  groups.set(key, [...(groups.get(key) ?? []), m]);
}
const shared = [...groups.entries()]
  .filter(([, list]) => list.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

const sharedSameName = shared.filter(
  ([, list]) =>
    new Set(list.map((m) => m.productNameDisplay.toLowerCase())).size === 1,
).length;
const missingNumber = medicines.filter((m) => isEmptyValue(m.nafdacNo));

const sharedCsvPath = `data/shared-nafdac-numbers-${dataDate}.csv`;
await safeWrite(
  sharedCsvPath,
  toCsv(
    [
      "NAFDAC No.",
      "Records sharing it",
      "Product ID",
      "Product name",
      "Strength",
      "Applicant",
      "Status",
    ],
    shared.flatMap(([number, list]) =>
      list.map((m) => [
        number,
        list.length,
        m.productId,
        m.productNameDisplay,
        decodeEntities(m.strength),
        m.applicantDisplay,
        m.status,
      ]),
    ),
  ),
);
const sharedRecordCount = shared.reduce(
  (sum, [, list]) => sum + list.length,
  0,
);
console.log(
  `\nShared NAFDAC numbers: ${shared.length} numbers, ${sharedRecordCount} records`,
);
console.log(`  Same product name in the group:      ${sharedSameName}`);
console.log(
  `  Different product names in the group: ${shared.length - sharedSameName}`,
);
console.log(`  Records with no NAFDAC number:        ${missingNumber.length}`);
console.log(`Saved: ${sharedCsvPath}`);

// ---------- 4. Expiry and status ----------
const pastExpiry = medicines.filter(
  (m) => m.expiryDate && m.expiryDate < today,
);
const statusOfPastExpiry: Record<string, number> = {};
for (const m of pastExpiry)
  statusOfPastExpiry[m.status] = (statusOfPastExpiry[m.status] ?? 0) + 1;

const statusCounts: Record<string, number> = {};
for (const m of medicines)
  statusCounts[m.status] = (statusCounts[m.status] ?? 0) + 1;

console.log(
  `\nRegistrations past their expiry date (as of ${today}): ${pastExpiry.length}`,
);
console.table(statusOfPastExpiry);

// ---------- 5. Small formatting issues ----------
const strayspaces = medicines.filter(
  (m) => m.nafdacNo !== m.nafdacNo.trim(),
).length;
const noteCounts: Record<string, number> = {};
for (const m of medicines)
  for (const n of m.qualityNotes) noteCounts[n] = (noteCounts[n] ?? 0) + 1;

console.log(`\nNAFDAC numbers with stray spaces: ${strayspaces}`);

// ---------- 6. The written report for the PM ----------
const table = (headers: string[], rows: (string | number)[][]) =>
  [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

const report = `# Medicines data: quality report

- **Source:** NAFDAC Greenbook (https://greenbook.nafdac.gov.ng/), downloaded ${fetchedAt}
- **Medicines in this dataset:** ${medicines.length} (the "Drugs" category plus ${medicines.filter((m) => m.categoryMissing).length} medicines NAFDAC left uncategorised)
- **Status:** ${Object.entries(statusCounts)
  .map(([s, n]) => `${s}: ${n}`)
  .join(", ")}
- **Report generated:** ${today}

The data was not corrected or edited. Values are as NAFDAC published them. "Empty" means blank, "NA", "N/A", "nil", "null" or "none".

## 1. Empty cells per column

${table(
  ["Column", "Empty cells"],
  emptyCounts.map((e) => [e.column, e.empty]),
)}

## 2. NAFDAC numbers used by more than one record

- **${shared.length}** numbers are shared by **${sharedRecordCount}** records.
- In **${shared.length - sharedSameName}** of these groups the product names differ (for example, two different medicines with one number).
- **${missingNumber.length}** records have no NAFDAC number.
- Full list: the **Shared NAFDAC numbers** tab in the Excel file.

**What this means for the app:** looking up one number can return several records, so the app must compare the product name to find the right one.

## 3. Registrations past their expiry date

- **${pastExpiry.length}** registrations have an expiry date before ${today}.
- Their status: ${Object.entries(statusOfPastExpiry)
  .map(([s, n]) => `${s}: ${n}`)
  .join(", ")}.

**What this means for the app:** a past expiry date with status "Ongoing Renewal" means renewal is in progress, so it should not be shown as invalid.

## 4. Notes found inside product names

NAFDAC's database adds markers such as "##" and "**" to many names, and staff sometimes leave notes in brackets, such as "(duplicate)" or "(check smpc)". The Greenbook website hides "#" and "*" when it displays names, and so do we. The original name is kept in the spreadsheet.

${table(
  ["Note", "Records"],
  Object.entries(noteCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([n, c]) => [n, c]),
)}

## 5. Formatting

- **${strayspaces}** NAFDAC numbers have extra spaces before or after them. The app should ignore spaces when searching.
`;

await mkdir("reports", { recursive: true });

// A dated copy for history, plus a fixed "latest" copy the Excel link always points to.
const reportPath = `reports/quality-report-${dataDate}.md`;
await safeWrite(reportPath, report);
await safeWrite("reports/quality-report-latest.md", report);

console.log(
  `\nReport saved: ${reportPath} (and reports/quality-report-latest.md)`,
);
