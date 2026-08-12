import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { postInputSchema, toColumns } from "@/lib/post-input";
import { fieldErrorsFromZod } from "@/lib/validation";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function noDb() {
  return NextResponse.json(
    { ok: false, message: "The database isn’t connected." },
    { status: 503 },
  );
}

/** Refresh every public surface a post can appear on. */
function revalidatePost(slug: string, previousSlug?: string) {
  revalidatePath("/writing");
  revalidatePath(`/writing/${slug}`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/writing/${previousSlug}`);
  }
  revalidatePath("/");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
}

// GET — a single post for editing.
export async function GET(_req: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) return noDb();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json(
      { ok: false, message: "Unknown post." },
      { status: 400 },
    );
  }

  try {
    const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, message: "That post no longer exists." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, post: rows[0] });
  } catch (err) {
    console.error("[studio] get post failed:", err);
    return NextResponse.json(
      { ok: false, message: "Couldn’t load that post." },
      { status: 500 },
    );
  }
}

// PUT — update a post.
export async function PUT(req: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) return noDb();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json(
      { ok: false, message: "Unknown post." },
      { status: 400 },
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
  const suppliedSlug = (parsed.data.slug ?? "").trim();

  try {
    const existing = await db
      .select({ slug: posts.slug, publishedAt: posts.publishedAt })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    const previous = existing[0];
    if (!previous) {
      return NextResponse.json(
        { ok: false, message: "That post no longer exists." },
        { status: 404 },
      );
    }

    // Retitling an existing post must not silently move its URL and break
    // every link to it — only change the slug when one is explicitly supplied.
    const slug = suppliedSlug ? columns.slug : previous.slug;
    if (!slug) {
      return NextResponse.json(
        {
          ok: false,
          message: "That title doesn’t produce a usable web address.",
          fieldErrors: { slug: "Enter a slug using letters or numbers." },
        },
        { status: 400 },
      );
    }

    // Stamp publishedAt the first time it goes live; keep it stable after.
    const publishedAt =
      columns.status === "published"
        ? (previous.publishedAt ?? new Date())
        : null;

    await db
      .update(posts)
      .set({ ...columns, slug, publishedAt, updatedAt: new Date() })
      .where(eq(posts.id, id));

    revalidatePost(slug, previous.slug);
    return NextResponse.json({ ok: true, post: { id, slug } });
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
    console.error("[studio] update post failed:", err);
    return NextResponse.json(
      { ok: false, message: "Couldn’t save that post." },
      { status: 500 },
    );
  }
}

// DELETE — remove a post.
export async function DELETE(_req: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) return noDb();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json(
      { ok: false, message: "Unknown post." },
      { status: 400 },
    );
  }

  try {
    const rows = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning({ slug: posts.slug });

    if (rows[0]) revalidatePost(rows[0].slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[studio] delete post failed:", err);
    return NextResponse.json(
      { ok: false, message: "Couldn’t delete that post." },
      { status: 500 },
    );
  }
}
