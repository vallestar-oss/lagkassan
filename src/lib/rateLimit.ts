import { headers } from "next/headers";

// Simple in-memory fixed-window rate limiter. Good enough for a pilot with
// moderate traffic — it's per-process (resets on cold start / deploy, and
// isn't shared across serverless instances), but it costs nothing and needs
// no external service. Upgrade to a shared store (e.g. Upstash Redis) if
// abuse becomes a real problem at scale.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Cheap guard against unbounded memory growth on a long-lived process —
// only runs the sweep once the map has grown large enough to matter.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count++;
  return { ok: true, retryAfterSeconds: 0 };
}

// Best-effort client IP from proxy headers (works on Vercel). Falls back to
// a constant so local dev / missing headers don't throw — worst case, all
// unidentified requests share one bucket rather than skipping the limiter.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
