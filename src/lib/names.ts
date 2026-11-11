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

/**
 * Short public labels for a participant list: first name + last-name initial
 * ("Anna Lindqvist" → "Anna L."), so full surnames aren't shown on the shared
 * payment page. When two labels would be identical, more of the last name is
 * shown ("Anna Te." / "Anna Th."); if that still can't separate them (e.g.
 * different middle names), the full names are used. Returned in input order.
 */
export function shortNames(fullNames: string[]): string[] {
  const parts = fullNames.map((n) => n.trim().split(/\s+/));
  const letters = parts.map(() => 1);

  const label = (i: number): string => {
    const p = parts[i];
    if (p.length === 1) return p[0];
    const last = p[p.length - 1];
    const prefix = last.slice(0, letters[i]);
    const cased = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    return letters[i] >= last.length ? `${p[0]} ${cased}` : `${p[0]} ${cased}.`;
  };

  const collisions = (labels: string[]) => {
    const groups = new Map<string, number[]>();
    labels.forEach((l, i) => {
      // "Anna Te" and "Anna Te." read the same — ignore the abbreviation dot.
      const key = l.toLowerCase().replace(/\.$/, "");
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    return [...groups.values()].filter((g) => g.length > 1).flat();
  };

  let labels = parts.map((_, i) => label(i));
  for (;;) {
    const clashing = collisions(labels);
    const growable = clashing.filter((i) => {
      const last = parts[i][parts[i].length - 1];
      return parts[i].length > 1 && letters[i] < last.length;
    });
    if (!growable.length) {
      for (const i of clashing) labels[i] = fullNames[i].trim();
      return labels;
    }
    for (const i of growable) letters[i]++;
    labels = parts.map((_, i) => label(i));
  }
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
