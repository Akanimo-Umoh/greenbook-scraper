import { mkdir, writeFile } from "node:fs/promises";
import {
  fetchPage,
  type GreenbookResponse,
  type RawProduct,
} from "./greenbook.ts";

const PAGE_SIZE = 1000; // the server allows 1,000 per request
const DELAY_MS = 2000; // pause between requests, to be polite
const MAX_RETRIES = 3; // attempts per page before giving up

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Tries a page up to MAX_RETRIES times, waiting longer after each failure (4s, 8s...).
async function fetchWithRetry(start: number): Promise<GreenbookResponse> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetchPage(start, PAGE_SIZE);
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      const wait = DELAY_MS * 2 ** attempt;
      console.warn(
        `  Attempt ${attempt} failed: ${(error as Error).message}. Retrying in ${wait / 1000}s...`,
      );
      await sleep(wait);
    }
  }
  throw new Error("Unreachable");
}

const products: RawProduct[] = [];
let start = 0;
let total = Infinity; // unknown until the first response tells us

console.log("Starting Greenbook scrape...\n");

while (start < total) {
  const page = await fetchWithRetry(start);
  total = page.recordsTotal;

  if (page.data.length === 0) break; // safety net: stop if a page comes back empty

  products.push(...page.data);
  console.log(
    `Fetched rows ${start + 1}–${start + page.data.length} of ${total}`,
  );

  start += PAGE_SIZE;
  if (start < total) await sleep(DELAY_MS);
}

// ---- Checks ----
const uniqueIds = new Set(products.map((p) => p.product_id));

console.log("\n---- Summary ----");
console.log("Site says total:   ", total);
console.log("Rows collected:    ", products.length);
console.log("Unique product IDs:", uniqueIds.size);

if (uniqueIds.size !== total) {
  console.warn(
    `\nWarning: ${total - uniqueIds.size} products missing or duplicated. Run the scrape again.`,
  );
}

// How many products are in each category?
const byCategory: Record<string, number> = {};
for (const p of products) {
  byCategory[p.category_name] = (byCategory[p.category_name] ?? 0) + 1;
}
console.log("\nProducts per category:");
console.table(byCategory);

// ---- Save the raw data exactly as NAFDAC returned it ----
await mkdir("data", { recursive: true });
const today = new Date().toISOString().slice(0, 10); // e.g. 2026-11-25
const filePath = `data/greenbook-raw-${today}.json`;

await writeFile(
  filePath,
  JSON.stringify(
    {
      source: "https://greenbook.nafdac.gov.ng/",
      fetchedAt: new Date().toISOString(),
      recordsTotal: total,
      products,
    },
    null,
    2,
  ),
);

console.log(`\nSaved ${products.length} products to ${filePath}`);
