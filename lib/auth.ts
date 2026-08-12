/**
 * Authentication for the private /studio.
 *
 * A single author signs in with STUDIO_PASSWORD; the server issues an
 * HMAC-signed, httpOnly session cookie. Uses Web Crypto (not node:crypto) so
 * the identical code runs in Edge middleware and in Node route handlers.
 *
 * If STUDIO_PASSWORD or SESSION_SECRET is unset the studio is disabled
 * entirely — a misconfigured deploy is never an unprotected studio.
 */

export const SESSION_COOKIE = "studio_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const encoder = new TextEncoder();

export function isStudioConfigured(): boolean {
  return Boolean(process.env.STUDIO_PASSWORD && process.env.SESSION_SECRET);
}

function base64url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64url(sig);
}

/** Constant-time string comparison — avoids leaking length/content by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function sha256(value: string): Promise<string> {
  return base64url(
    await crypto.subtle.digest("SHA-256", encoder.encode(value)),
  );
}

/** Verify a submitted password against STUDIO_PASSWORD, timing-safely. */
export async function verifyPassword(submitted: string): Promise<boolean> {
  const expected = process.env.STUDIO_PASSWORD;
  if (!expected) return false;
  // Compare fixed-length digests so comparison time never depends on input.
  const [a, b] = await Promise.all([sha256(submitted), sha256(expected)]);
  return timingSafeEqual(a, b);
}

/** Mint a signed session token valid for SESSION_TTL_SECONDS. */
export async function createSessionToken(): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${expires}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

/** Validate a session cookie value: signature intact and not expired. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [subject, expiresRaw, signature] = parts as [string, string, string];
  if (subject !== "admin") return false;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires * 1000 < Date.now()) return false;

  const expected = await hmac(`${subject}.${expiresRaw}`, secret);
  return timingSafeEqual(signature, expected);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
