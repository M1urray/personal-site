import { NextResponse } from "next/server";
import { createElement } from "react";
import { contactSchema, fieldErrorsFromZod } from "@/lib/validation";
import { getClientIp, hashIp } from "@/lib/hash";
import { rateLimit } from "@/lib/rate-limit";
import { getDb } from "@/db";
import { enquiries } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { ContactNotification } from "@/emails/ContactNotification";
import { ContactAcknowledgement } from "@/emails/ContactAcknowledgement";

export const runtime = "nodejs";

const MIN_ELAPSED_MS = 3000;
const SILENT_OK = {
  ok: true,
  message: "Thanks — your message is on its way.",
};

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

  // Honeypot — real users never fill this. Pretend success so bots learn nothing.
  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    return NextResponse.json(SILENT_OK);
  }
  // Minimum time-to-submit — instant submits are almost always bots.
  if (typeof raw.elapsed === "number" && raw.elapsed < MIN_ELAPSED_MS) {
    return NextResponse.json(SILENT_OK);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: fieldErrorsFromZod(parsed.error),
      },
      { status: 400 },
    );
  }

  const ipHash = hashIp(getClientIp(req));
  const limit = rateLimit(`contact:${ipHash}`);
  if (!limit.ok) {
    const mins = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return NextResponse.json(
      {
        ok: false,
        message: `That’s several messages in a short time. Please try again in about ${mins} minute${
          mins === 1 ? "" : "s"
        }, or email rknjonjo@gmail.com directly.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const { name, email, company, projectType, message } = parsed.data;
  const companyValue = company && company.length > 0 ? company : undefined;

  const db = getDb();
  if (db) {
    try {
      await db.insert(enquiries).values({
        name,
        email,
        company: companyValue ?? null,
        message,
        projectType,
        ipHash,
      });
    } catch (err) {
      console.error("[contact] enquiry insert failed:", err);
    }
  }

  const to = process.env.CONTACT_TO_EMAIL;
  let notified = false;
  if (to) {
    const notify = await sendEmail({
      to,
      subject: `New enquiry — ${name}`,
      replyTo: email,
      react: createElement(ContactNotification, {
        name,
        email,
        company: companyValue,
        projectType,
        message,
      }),
    });
    notified = notify.sent;

    // Acknowledge the sender — best effort, never blocks the response outcome.
    await sendEmail({
      to: email,
      subject: "Thanks — your message reached me",
      react: createElement(ContactAcknowledgement, { name }),
    });
  }

  // Nothing was stored and nothing was sent — be honest, don't fake success.
  if (!db && !notified) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The contact form isn’t connected yet. Please email rknjonjo@gmail.com directly.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Thanks — your message reached me. I’ll reply within a couple of working days.",
  });
}
