import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { readingTime } from "@/lib/blog";
import { renderPostCard } from "@/app/og/post-card";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * The share card for any post, drafts included — so the author can see what
 * LinkedIn will show before queueing it. Behind the studio session like every
 * /api/studio route, and never cached.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const db = getDb();
  const id = Number((await params).id);
  if (!db || !Number.isInteger(id)) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  const post = rows[0];
  if (!post) return new Response("Not found", { status: 404 });

  return renderPostCard(
    { ...post, readingTime: readingTime(post.body) },
    { "Cache-Control": "private, no-store" },
  );
}
