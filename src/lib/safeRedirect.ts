const BASE = "http://safe-redirect.invalid";

/**
 * Returns `target` only if it is a same-origin relative path, otherwise
 * `fallback`. Guards against open redirects: `//evil.com`, `/\evil.com`,
 * `https://evil.com` and `@evil.com` (when appended to an origin) must never
 * leave the site.
 */
export function safeRedirectPath(
  target: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!target || !target.startsWith("/")) return fallback;
  // Browsers treat "//host" and "/\host" as protocol-relative; tabs/newlines
  // are stripped by URL parsers and can hide a second slash.
  if (target.startsWith("//") || target.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(target)) return fallback;

  try {
    const url = new URL(target, BASE);
    if (url.origin !== BASE) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
