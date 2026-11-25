// Turns web codes back into the characters they stand for, e.g. "&amp;" becomes "&".
// This doesn't change what NAFDAC wrote. It's how these characters are written in web data.
export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Values NAFDAC uses to mean "nothing here".
const EMPTY_MARKERS = new Set(["", "na", "n/a", "nil", "null", "none", "-"]);

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return EMPTY_MARKERS.has(String(value).trim().toLowerCase());
}

// A version of the NAFDAC number used only for comparing and searching:
// no spaces, all capitals, so " b4-1234" and "B4-1234" count as the same number.
export function normaliseNafdac(nafdacNo: string): string {
  return nafdacNo.replace(/\s+/g, "").toUpperCase();
}
