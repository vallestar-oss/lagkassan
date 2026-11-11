export const MAX_NAME_LENGTH = 100;

/**
 * Cleans a list of submitted names: trims, drops empties, caps each name at
 * MAX_NAME_LENGTH and removes case-insensitive duplicates (keeping the first).
 * `tooMany` is true when more than `maxCount` distinct names remain.
 */
export function normalizeNames(
  raw: string[],
  maxCount: number,
): { names: string[]; tooMany: boolean } {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const entry of raw) {
    const name = entry.trim().slice(0, MAX_NAME_LENGTH).trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return { names, tooMany: names.length > maxCount };
}

/** Splits a pasted textarea value (one name per line) into trimmed, capped names. */
export function parseNameList(raw: string): string[] {
  return raw
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => n.slice(0, MAX_NAME_LENGTH));
}

/**
 * Separates names to insert from names to skip: a name is skipped when it
 * already exists, or repeats an earlier name in the same list
 * (case-insensitive). Skipped names are reported back to the user.
 */
export function splitNewNames(
  names: string[],
  existing: string[],
): { toInsert: string[]; skipped: string[] } {
  const seen = new Set(existing.map((n) => n.trim().toLowerCase()));
  const toInsert: string[] = [];
  const skipped: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) {
      skipped.push(name);
    } else {
      seen.add(key);
      toInsert.push(name);
    }
  }
  return { toInsert, skipped };
}
