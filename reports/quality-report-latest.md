# Medicines data: quality report

- **Source:** NAFDAC Greenbook (https://greenbook.nafdac.gov.ng/), downloaded 2026-11-25T12:04:30.603Z
- **Medicines in this dataset:** 7622 (the "Drugs" category plus 9 medicines NAFDAC left uncategorised)
- **Status:** Ongoing Renewal: 2613, Active: 5009
- **Report generated:** 2026-11-25

The data was not corrected or edited. Values are as NAFDAC published them. "Empty" means blank, "NA", "N/A", "nil", "null" or "none".

## 1. Empty cells per column

| Column | Empty cells |
| --- | --- |
| Synonym | 6803 |
| SmPC link | 1671 |
| Pack size | 1089 |
| ATC code | 396 |
| Composition | 116 |
| Strength | 10 |
| Route | 8 |
| NAFDAC No. | 4 |
| Applicant | 3 |
| Product name | 0 |
| Active ingredient(s) | 0 |
| Form | 0 |
| Approval date | 0 |
| Expiry date | 0 |

## 2. NAFDAC numbers used by more than one record

- **287** numbers are shared by **587** records.
- In **237** of these groups the product names differ (for example, two different medicines with one number).
- **4** records have no NAFDAC number.
- Full list: the **Shared NAFDAC numbers** tab in the Excel file.

**What this means for the app:** looking up one number can return several records, so the app must compare the product name to find the right one.

## 3. Registrations past their expiry date

- **2550** registrations have an expiry date before 2026-11-25.
- Their status: Ongoing Renewal: 2550.

**What this means for the app:** a past expiry date with status "Ongoing Renewal" means renewal is in progress, so it should not be shown as invalid.

## 4. Notes found inside product names

NAFDAC's database adds markers such as "##" and "**" to many names, and staff sometimes leave notes in brackets, such as "(duplicate)" or "(check smpc)". The Greenbook website hides "#" and "*" when it displays names, and so do we. The original name is kept in the spreadsheet.

| Note | Records |
| --- | --- |
| Name contains # marker | 3948 |
| Name contains * marker | 2647 |
| Name contains _ marker | 877 |
| Name contains $ marker | 107 |
| NAFDAC note in name: "(strength format)" | 91 |
| NAFDAC note in name: "(check pack size)" | 62 |
| NAFDAC note in name: "(duplicate)" | 51 |
| NAFDAC note in name: "(check composition)" | 25 |
| NAFDAC note in name: "(incomplete smpc)" | 15 |
| NAFDAC note in name: "(check smpc)" | 15 |
| NAFDAC note in name: "(duplicate, different product)" | 11 |
| NAFDAC note in name: "(check dosage form)" | 11 |
| NAFDAC note in name: "(smpc null)" | 9 |
| Category missing in Greenbook | 9 |
| NAFDAC note in name: "(check strength)" | 8 |
| NAFDAC note in name: "(null smpc)" | 7 |
| NAFDAC note in name: "(check NRN)" | 6 |
| NAFDAC note in name: "(updates needed)" | 5 |
| NAFDAC note in name: "(check active ingredients)" | 4 |
| NAFDAC note in name: "(duplicate NRN)" | 3 |
| NAFDAC note in name: "(no NRN)" | 3 |
| NAFDAC note in name: "(pack size)" | 3 |
| NAFDAC note in name: "(check description)" | 3 |
| NAFDAC note in name: "(incorrect SMPC)" | 3 |
| NAFDAC note in name: "(check strength format)" | 3 |
| NAFDAC note in name: "(duplicate, different product name)" | 2 |
| NAFDAC note in name: "(check product description)" | 2 |
| NAFDAC note in name: "(incomplete SMPC)" | 2 |
| NAFDAC note in name: "(Updates needed)" | 2 |
| NAFDAC note in name: "(check strength, pack size)" | 2 |
| NAFDAC note in name: "(Duplicate)" | 2 |
| NAFDAC note in name: "(NRN format)" | 1 |
| NAFDAC note in name: "(check description, pack size)" | 1 |
| NAFDAC note in name: "(duplicate, different manufacturer)" | 1 |
| NAFDAC note in name: "(check active ingredient spelling)" | 1 |
| NAFDAC note in name: "(triplicate with different dosage form)" | 1 |
| NAFDAC note in name: "(check strengths, smpc)" | 1 |
| NAFDAC note in name: "(triplicate wtih different dosage form)" | 1 |
| NAFDAC note in name: "(check brand name in smpc)" | 1 |
| NAFDAC note in name: "(Triplicate)" | 1 |
| NAFDAC note in name: "(duplicate, different active ingredients)" | 1 |
| NAFDAC note in name: "(duplicate, different stenght)" | 1 |
| NAFDAC note in name: "(check product description, check pack size)" | 1 |
| NAFDAC note in name: "(check dosage form, pack size)" | 1 |
| NAFDAC note in name: "(check smpc, pack size)" | 1 |
| NAFDAC note in name: "(check smpc pack sizes)" | 1 |
| NAFDAC note in name: "(check smpc, strength format)" | 1 |
| NAFDAC note in name: "(duplicate, different active ingredients and strength format)" | 1 |
| NAFDAC note in name: "(check pack size, NRN, dosage form)" | 1 |
| NAFDAC note in name: "(check dosage form, active ingredients)" | 1 |
| NAFDAC note in name: "(Check Strength)" | 1 |
| NAFDAC note in name: "(Incomplete smpc)" | 1 |
| NAFDAC note in name: "(NRN A4-100051)" | 1 |
| NAFDAC note in name: "(check 04-2598)" | 1 |
| NAFDAC note in name: "(check composition, pack size)" | 1 |
| NAFDAC note in name: "(check strengths)" | 1 |
| NAFDAC note in name: "(check SMPC composition)" | 1 |
| NAFDAC note in name: "(check active ingredients, strength format)" | 1 |
| NAFDAC note in name: "(check composition and pack size)" | 1 |
| NAFDAC note in name: "(check active ingredient and strength format)" | 1 |
| NAFDAC note in name: "(check dosage form in brand name)" | 1 |
| NAFDAC note in name: "(duplicate in published)" | 1 |
| NAFDAC note in name: "(check active ingredient)" | 1 |
| NAFDAC note in name: "(NRN C4-1453)" | 1 |

## 5. Formatting

- **118** NAFDAC numbers have extra spaces before or after them. The app should ignore spaces when searching.
