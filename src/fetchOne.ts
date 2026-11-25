import { fetchPage } from "./greenbook.ts";

const LENGTH = Number(process.argv[2] ?? 10);

const page = await fetchPage(0, LENGTH);

console.log("Total records on the site:", page.recordsTotal);
console.log("Rows we asked for:", LENGTH);
console.log("Rows we got back:", page.data.length);
console.log("\nFirst product:");
console.log(page.data[0]);
// console.log("\nLast product:", page.data[page.data.length - 1].product_name);
// console.log("Unique product IDs:", new Set(page.data.map((p) => p.product_id)).size);