import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { PostEditor } from "@/components/studio/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const db = getDb();
  if (!db) notFound();

  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.id, numericId))
    .limit(1);
  const row = rows[0];
  if (!row) notFound();

  return (
    <>
      <StudioHeader />
      <div className="studio-body">
        <div className="studio-topline">
          <Link href="/studio" className="back-link">
            ← All posts
          </Link>
          {row.status === "published" && (
            <Link
              href={`/writing/${row.slug}`}
              className="back-link"
              target="_blank"
            >
              View live ↗
            </Link>
          )}
        </div>

        <PostEditor
          initial={{
            id: row.id,
            title: row.title,
            slug: row.slug,
            description: row.description,
            body: row.body,
            category: row.category,
            coverUrl: row.coverUrl ?? "",
            coverAlt: row.coverAlt ?? "",
            status: row.status,
            featured: row.featured,
          }}
        />
      </div>
    </>
  );
}
