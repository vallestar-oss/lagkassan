// Characters that make Excel / Sheets / LibreOffice treat a cell as a formula.
// Tab and carriage return are included because some apps strip them and then
// evaluate what follows.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/**
 * Escapes one CSV cell (semicolon-delimited, Swedish-locale Excel).
 *
 * Text can come from the public payment form (payer name / email), so a cell
 * like `=HYPERLINK(...)` must never reach the treasurer's spreadsheet as a
 * live formula (CSV injection). Strings starting with a formula trigger are
 * prefixed with `'`, which spreadsheets render as plain text. Real numbers are
 * left alone so negative amounts stay numeric.
 */
export function escapeCsvCell(value: string | number): string {
  let str = String(value);
  if (typeof value === "string" && FORMULA_TRIGGER.test(str)) {
    str = `'${str}`;
  }
  if (/[";\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
