import { NextResponse } from "next/server";
import { and, asc, count, eq, isNotNull, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { isCronConfigured, verifyCronSecret } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Take queued drafts live on schedule.
 *
 * Vercel Cron calls this once a day with `Authorization: Bearer $CRON_SECRET`.
 * The *cadence* lives in each post's `scheduled_for`, not in the cron
 * expression — so the two-day rhythm survives a missed run, works on plans
 * that only allow a daily trigger, and can be re-ordered from the studio
 * without a redeploy.
 *
 * Publishing is what makes the post appear in /rss.xml, which is the trigger
 * Zapier watches to post to LinkedIn. Nothing else needs to know about this.
 */

/**
 * At most one post per run. If the cron were down for a week, draining the
 * backlog all at once would fire a burst of LinkedIn posts — far worse than
 * the queue simply running a few days late.
 */
const MAX_PER_RUN = 1;

function notFound() {
  return new NextResponse("Not found", { status: 404 });
}

async function publishDue(): Promise<Response> {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, message: "The database isn’t connected." },
      { status: 503 },
    );
  }

  const now = new Date();

  try {
    const due = await db
      .select({ id: posts.id, slug: posts.slug, title: posts.title })
      .from(posts)
      .where(
        and(
          eq(posts.status, "draft"),
          isNotNull(posts.scheduledFor),
          lte(posts.scheduledFor, now),
        ),
      )
      .orderBy(asc(posts.scheduledFor))
      .limit(MAX_PER_RUN);

    const published: { slug: string; title: string }[] = [];

    for (const post of due) {
      // Re-assert `status = 'draft'` in the update so an overlapping run (or a
      // hand-publish from the studio seconds earlier) can't publish it twice.
      const rows = await db
        .update(posts)
        .set({
          status: "published",
          publishedAt: now,
          // Clear the queue date: a published post must never be re-picked.
          scheduledFor: null,
          updatedAt: now,
        })
        .where(and(eq(posts.id, post.id), eq(posts.status, "draft")))
        .returning({ slug: posts.slug });

      if (rows[0]) {
        published.push({ slug: post.slug, title: post.title });
        revalidatePath(`/writing/${post.slug}`);
      }
    }

    if (published.length > 0) {
      revalidatePath("/writing");
      revalidatePath("/");
      revalidatePath("/rss.xml");
      revalidatePath("/sitemap.xml");
      for (const post of published) {
        console.log(`[cron] published /writing/${post.slug} — ${post.title}`);
      }
    }

    const [queue] = await db
      .select({ remaining: count() })
      .from(posts)
      .where(and(eq(posts.status, "draft"), isNotNull(posts.scheduledFor)));

    return NextResponse.json({
      ok: true,
      ranAt: now.toISOString(),
      published,
      remaining: queue?.remaining ?? 0,
    });
  } catch (err) {
    console.error("[cron] scheduled publish failed:", err);
    return NextResponse.json(
      { ok: false, message: "Scheduled publish failed." },
      { status: 500 },
    );
  }
}

async function handle(req: Request): Promise<Response> {
  // No secret configured means no scheduled publishing — and, as with the
  // studio, an unconfigured deploy shows no sign the endpoint exists.
  if (!isCronConfigured()) return notFound();
  if (!(await verifyCronSecret(req.headers.get("authorization")))) {
    return notFound();
  }
  return publishDue();
}

export async function GET(req: Request) {
  return handle(req);
}

// POST as well, so the queue can be nudged by hand (or from Zapier Webhooks)
// without waiting for the next scheduled run.
export async function POST(req: Request) {
  return handle(req);
}
