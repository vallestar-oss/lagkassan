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
