import { readdir, readFile, writeFile } from "node:fs/promises";
import type { RawProduct } from "./greenbook.ts";
import { decodeEntities } from "./text.ts";

// One flat row per medicine. Raw fields are copied exactly as NAFDAC wrote them.
export interface Medicine {
  productId: number;
  nafdacNo: string;
  productName: string;
  activeIngredient: string;
  synonym: string;
  strength: string;
  form: string;
  route: string;
  packSize: string;
  composition: string;
  atcCode: string;
  applicant: string;
  status: string;
  approvalDate: string;
  expiryDate: string;
  smpc: string;
  category: string;
  // True when NAFDAC left the category empty but the product is clearly a medicine.
  categoryMissing: boolean;
  // Display-only copies that match what greenbook.nafdac.gov.ng shows on screen.
  productNameDisplay: string;
  applicantDisplay: string;
  // Notes about the record itself, for the data-quality report.
  qualityNotes: string[];
}

// Shows the name the way NAFDAC's own site does: no "#" or "*" marks, decoded, tidy spaces.
// "_" and "$" are left in, because the site shows them too.
function displayName(name: string): string {
  return decodeEntities(name).replace(/[#*]/g, "").replace(/\s+/g, " ").trim();
}

// Collects notes about the record so the PM can see where NAFDAC's data needs care.
function findQualityNotes(p: RawProduct): string[] {
  const notes: string[] = [];
  const name = p.product_name;

  if (name.includes("#")) notes.push("Name contains # marker");
  if (name.includes("*")) notes.push("Name contains * marker");
  if (/_\s*$/.test(name) || /_\s*\(/.test(name))
    notes.push("Name contains _ marker");
  if (/\$\d?\s*$/.test(name)) notes.push("Name contains $ marker");

  // Notes NAFDAC staff wrote in brackets, e.g. "(duplicate, different product)" or "(check smpc)"
  const staffNote = name.match(
    /\((duplicate[^)]*|check[^)]*|incorrect[^)]*|incomplete[^)]*|updates needed|no NRN|null smpc|smpc null|strength format|pack size|triplicate[^)]*|NRN [^)]*)\)/i,
  );
  if (staffNote) notes.push(`NAFDAC note in name: "${staffNote[0]}"`);

  if (p.category_name === "N/A") notes.push("Category missing in Greenbook");
  return notes;
}

// A product with no category counts as a medicine if it has a real dosage form.
function isUncategorisedMedicine(p: RawProduct): boolean {
  return (
    p.category_name === "N/A" &&
    p.form_name !== "NA" &&
    p.form_name.trim() !== ""
  );
}

// Finds the newest raw file in /data, e.g. data/greenbook-raw-2026-11-25.json
async function latestRawFile(): Promise<string> {
  const files = (await readdir("data"))
    .filter(
      (name) => name.startsWith("greenbook-raw-") && name.endsWith(".json"),
    )
    .sort();
  if (files.length === 0)
    throw new Error("No raw file found. Run `pnpm scrape` first.");
  return `data/${files[files.length - 1]}`;
}

const rawPath = await latestRawFile();
console.log(`Reading ${rawPath}...`);

const raw = JSON.parse(await readFile(rawPath, "utf-8")) as {
  fetchedAt: string;
  products: RawProduct[];
};

// ---- 1. Keep medicines: the "Drugs" category plus uncategorised medicines ----
const drugs = raw.products.filter(
  (p) => p.category_name === "Drugs" || isUncategorisedMedicine(p),
);

// ---- 2. Flatten each one into a simple row ----
const medicines: Medicine[] = drugs.map((p) => ({
  productId: p.product_id,
  nafdacNo: p.NAFDAC,
  productName: p.product_name,
  activeIngredient: p.ingredient_name,
  synonym: p.synonym,
  strength: p.strength,
  form: p.form_name,
  route: p.route_name,
  packSize: p.pack_size,
  composition: p.composition,
  atcCode: p.atc,
  applicant: p.applicant_name,
  status: p.status,
  approvalDate: p.approval_date,
  expiryDate: p.expiry_date,
  smpc: p.smpc,
  category: p.category_name,
  categoryMissing: p.category_name === "N/A",
  productNameDisplay: displayName(p.product_name),
  applicantDisplay: decodeEntities(p.applicant_name).trim(),
  qualityNotes: findQualityNotes(p),
}));

// ---- 3. Save ----
const date = raw.fetchedAt.slice(0, 10);
const outPath = `data/medicines-${date}.json`;
await writeFile(
  outPath,
  JSON.stringify(
    {
      source: rawPath,
      fetchedAt: raw.fetchedAt,
      count: medicines.length,
      medicines,
    },
    null,
    2,
  ),
);

// ---- 4. Summary ----
const fromDrugs = medicines.filter((m) => !m.categoryMissing).length;
const fromNA = medicines.filter((m) => m.categoryMissing).length;
const withNotes = medicines.filter((m) => m.qualityNotes.length > 0).length;

console.log(`Saved ${medicines.length} medicines to ${outPath}`);
console.log(`  From "Drugs" category:        ${fromDrugs}`);
console.log(`  Uncategorised but medicine:   ${fromNA}`);
console.log(`  Records with quality notes:   ${withNotes}\n`);

console.log("Uncategorised medicines we kept (raw name -> display name):");
console.table(
  medicines
    .filter((m) => m.categoryMissing)
    .map((m) => ({
      id: m.productId,
      nafdac: m.nafdacNo,
      raw: m.productName,
      display: m.productNameDisplay,
    })),
);
