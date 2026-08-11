import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { postViews } from "@/db/schema";

export const runtime = "nodejs";

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

type Ctx = { params: Promise<{ slug: string }> };

// GET — read the current count without incrementing.
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ count: null });

  try {
    const rows = await db
      .select({ count: postViews.count })
      .from(postViews)
      .where(sql`${postViews.slug} = ${slug}`)
      .limit(1);
    return NextResponse.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    console.error("[views] read failed:", err);
    return NextResponse.json({ count: null });
  }
}

// POST — register a view (atomic upsert-increment) and return the new count.
export async function POST(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ count: null });

  try {
    const rows = await db
      .insert(postViews)
      .values({ slug, count: 1 })
      .onConflictDoUpdate({
        target: postViews.slug,
        set: { count: sql`${postViews.count} + 1`, updatedAt: new Date() },
      })
      .returning({ count: postViews.count });
    return NextResponse.json({ count: rows[0]?.count ?? 1 });
  } catch (err) {
    console.error("[views] increment failed:", err);
    return NextResponse.json({ count: null });
  }
}
