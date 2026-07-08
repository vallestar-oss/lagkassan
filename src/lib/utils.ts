// Amounts are stored as integer øre (1/100 SEK) to avoid floating-point errors.
// 199 kr = 19900 øre. Always use these helpers at the boundary.

export function parseSekToOre(input: string): number {
  const cleaned = input.replace(",", ".").replace(/[^0-9.]/g, "");
  return Math.round(parseFloat(cleaned) * 100);
}

export function formatOre(ore: number): string {
  const sek = ore / 100;
  return sek % 1 === 0
    ? `${sek.toLocaleString("sv-SE")} kr`
    : `${sek.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`;
}

export function formatSwedishDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatSwedishDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toFilename(title: string): string {
  return title.trim().replace(/[^a-zA-Z0-9åäöÅÄÖ _-]/g, "").replace(/\s+/g, "-") || "lagkassan";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
