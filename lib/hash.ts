import { createHash } from "node:crypto";

/**
 * Hash a client IP with a server-side salt. Raw IPs are never logged or stored;
 * only this one-way hash reaches the database, where it is used solely for
 * coarse per-IP rate limiting.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "no-salt-set";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}
