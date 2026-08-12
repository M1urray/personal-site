import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { postInputSchema, toColumns } from "@/lib/post-input";
import { fieldErrorsFromZod } from "@/lib/validation";

export const runtime = "nodejs";

function noDb() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "The database isn’t connected. Set DATABASE_URL, then reload the studio.",
    },
    { status: 503 },
  );
}

// GET — every post (drafts included) for the studio index.
export async function GET() {
  const db = getDb();
  if (!db) return noDb();

  try {
    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        category: posts.category,
        status: posts.status,
        featured: posts.featured,
        coverUrl: posts.coverUrl,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .orderBy(desc(posts.updatedAt));
    return NextResponse.json({ ok: true, posts: rows });
  } catch (err) {
    console.error("[studio] list posts failed:", err);
    return NextResponse.json(
      { ok: false, message: "Couldn’t load your posts." },
      { status: 500 },
    );
  }
}

// POST — create a post.
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return noDb();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Couldn’t read that request." },
      { status: 400 },
    );
  }

  const parsed = postInputSchema.safeParse(body);
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

  const columns = toColumns(parsed.data);
  if (!columns.slug) {
    return NextResponse.json(
      {
        ok: false,
        message: "That title doesn’t produce a usable web address. Add a slug.",
        fieldErrors: { slug: "Enter a slug using letters or numbers." },
      },
      { status: 400 },
    );
  }

  try {
    const rows = await db
      .insert(posts)
      .values({
        ...columns,
        publishedAt: columns.status === "published" ? new Date() : null,
      })
      .returning({ id: posts.id, slug: posts.slug });

    const created = rows[0]!;
    if (columns.status === "published") {
      revalidatePath("/writing");
      revalidatePath(`/writing/${created.slug}`);
      revalidatePath("/");
    }
    return NextResponse.json({ ok: true, post: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("duplicate key") || message.includes("unique")) {
      return NextResponse.json(
        {
          ok: false,
          message: "A post already uses that web address.",
          fieldErrors: { slug: "Pick a different slug — this one is taken." },
        },
        { status: 409 },
      );
    }
    console.error("[studio] create post failed:", err);
    return NextResponse.json(
      { ok: false, message: "Couldn’t save that post." },
      { status: 500 },
    );
  }
}
