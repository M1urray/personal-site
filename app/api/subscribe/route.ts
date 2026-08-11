import { NextResponse } from "next/server";
import { createElement } from "react";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { subscribeSchema, fieldErrorsFromZod } from "@/lib/validation";
import { getClientIp, hashIp } from "@/lib/hash";
import { rateLimit } from "@/lib/rate-limit";
import { getDb } from "@/db";
import { subscribers } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { isEmailConfigured } from "@/lib/env";
import { SubscribeConfirm } from "@/emails/SubscribeConfirm";

export const runtime = "nodejs";

const MIN_ELAPSED_MS = 3000;
const SILENT_OK = {
  ok: true,
  message: "Almost there — check your inbox to confirm.",
};

function newToken() {
  return randomBytes(32).toString("hex");
}

// ---- POST: sign up (creates a pending subscriber, sends confirmation) -------
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "That request couldn’t be read. Please try again.",
      },
      { status: 400 },
    );
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    return NextResponse.json(SILENT_OK);
  }
  if (typeof raw.elapsed === "number" && raw.elapsed < MIN_ELAPSED_MS) {
    return NextResponse.json(SILENT_OK);
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please check your email address.",
        fieldErrors: fieldErrorsFromZod(parsed.error),
      },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db || !isEmailConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The newsletter isn’t accepting sign-ups just yet. Please check back soon.",
      },
      { status: 503 },
    );
  }

  const ipHash = hashIp(getClientIp(req));
  const limit = rateLimit(`subscribe:${ipHash}`);
  if (!limit.ok) {
    const mins = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return NextResponse.json(
      {
        ok: false,
        message: `Too many attempts. Please try again in about ${mins} minute${
          mins === 1 ? "" : "s"
        }.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const source =
    typeof raw.source === "string" && raw.source ? raw.source : "site";

  try {
    const existing = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);
    const current = existing[0];

    if (current?.status === "confirmed") {
      return NextResponse.json({
        ok: true,
        message: "You’re already subscribed — thanks for reading.",
      });
    }

    const token = newToken();
    if (current) {
      await db
        .update(subscribers)
        .set({ status: "pending", unsubscribeToken: token, source })
        .where(eq(subscribers.email, email));
    } else {
      await db
        .insert(subscribers)
        .values({ email, status: "pending", unsubscribeToken: token, source });
    }

    const confirmUrl = new URL(
      `/api/subscribe?token=${token}`,
      req.url,
    ).toString();
    const unsubscribeUrl = new URL(
      `/api/unsubscribe?token=${token}`,
      req.url,
    ).toString();

    const result = await sendEmail({
      to: email,
      subject: "Confirm your subscription",
      react: createElement(SubscribeConfirm, { confirmUrl }),
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (!result.sent) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "We couldn’t send the confirmation email. Please try again shortly.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Almost there — check your inbox to confirm your subscription.",
    });
  } catch (err) {
    console.error("[subscribe] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong on our side. Please try again.",
      },
      { status: 500 },
    );
  }
}

// ---- GET: confirm subscription via token ------------------------------------
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const db = getDb();

  const redirectTo = (status: string) =>
    NextResponse.redirect(new URL(`/newsletter?status=${status}`, req.url));

  if (!token || !db) return redirectTo("invalid");

  try {
    const rows = await db
      .update(subscribers)
      .set({ status: "confirmed", confirmedAt: new Date() })
      .where(eq(subscribers.unsubscribeToken, token))
      .returning({ id: subscribers.id });

    return redirectTo(rows.length > 0 ? "confirmed" : "invalid");
  } catch (err) {
    console.error("[subscribe] confirm failed:", err);
    return redirectTo("invalid");
  }
}
