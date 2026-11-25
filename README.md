# Greenbook Scraper

Downloads NAFDAC's Greenbook of registered products and turns the medicines into clean, shareable files, with a data-quality report.

Part of **CheckAm NG**, a product-verification app built for the Talenvo residency.

📄 **[Read the latest data-quality report](reports/quality-report-latest.md)**

## What it does

1. Downloads every product from the [NAFDAC Greenbook](https://greenbook.nafdac.gov.ng/) (about 9,000 records)
2. Keeps the medicines (the "Drugs" category plus medicines NAFDAC left uncategorised)
3. Exports them to JSON, CSV and Excel
4. Writes a report on empty fields, shared NAFDAC numbers, expired registrations and notes inside product names

**The data is never edited.** Values are kept exactly as NAFDAC published them. Display names only hide the `#` and `*` marks, as the Greenbook website itself does.

## How to run it

Needs Node.js 18+ and pnpm.

| Command | What it does |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm scrape` | Download all products from the Greenbook |
| `pnpm medicines` | Build the medicines dataset |
| `pnpm export` | Write the CSV files and the quality report |
| `pnpm excel` | Build the Excel file |

Output goes to `data/` (not committed) and `reports/` (committed).

## Being polite to NAFDAC's server

The Greenbook's robots.txt allows automated access. The scraper still sends one request at a time, waits 2 seconds between requests, retries gently after errors, and identifies itself.
