import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  createSessionToken,
  isStudioConfigured,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { getClientIp, hashIp } from "@/lib/hash";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  if (!isStudioConfigured()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // Throttle sign-in attempts per IP to blunt password guessing.
  const ipHash = hashIp(getClientIp(req));
  const limit = rateLimit(`studio-login:${ipHash}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    const mins = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return NextResponse.json(
      {
        ok: false,
        message: `Too many attempts. Try again in about ${mins} minute${
          mins === 1 ? "" : "s"
        }.`,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Couldn’t read that request." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success || !(await verifyPassword(parsed.data.password))) {
    return NextResponse.json(
      { ok: false, message: "That password isn’t right." },
      { status: 401 },
    );
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Studio session isn’t configured." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
