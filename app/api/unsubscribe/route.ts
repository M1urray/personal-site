import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { subscribers } from "@/db/schema";

export const runtime = "nodejs";

async function unsubscribe(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const db = getDb();

  const redirectTo = (status: string) =>
    NextResponse.redirect(new URL(`/newsletter?status=${status}`, req.url));

  if (!token || !db) return redirectTo("invalid");

  try {
    const rows = await db
      .update(subscribers)
      .set({ status: "unsubscribed" })
      .where(eq(subscribers.unsubscribeToken, token))
      .returning({ id: subscribers.id });

    return redirectTo(rows.length > 0 ? "unsubscribed" : "invalid");
  } catch (err) {
    console.error("[unsubscribe] failed:", err);
    return redirectTo("invalid");
  }
}

// One-click unsubscribe from an email link.
export const GET = unsubscribe;
// RFC 8058 List-Unsubscribe-Post sends a POST to the same URL.
export const POST = unsubscribe;
