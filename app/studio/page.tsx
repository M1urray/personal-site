import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { categoryLabels, formatDate, type Category } from "@/lib/blog";
import { formatQueued } from "@/lib/schedule";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { QueuePanel } from "@/components/studio/QueuePanel";

export const dynamic = "force-dynamic";

export default async function StudioIndexPage() {
  const db = getDb();
  const rows = db
    ? await db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          category: posts.category,
          status: posts.status,
          featured: posts.featured,
          scheduledFor: posts.scheduledFor,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .orderBy(desc(posts.updatedAt))
    : [];

  const drafts = rows.filter((row) => row.status === "draft");
  const queued = drafts
    .filter((row) => row.scheduledFor)
    .sort((a, b) => a.scheduledFor!.getTime() - b.scheduledFor!.getTime());

  return (
    <>
      <StudioHeader />

      <div className="studio-body">
        <div className="studio-topline">
          <h1 className="studio-h1">Posts</h1>
          <Link className="btn btn-solid" href="/studio/new">
            New post
          </Link>
        </div>

        {!db && (
          <p className="form-banner error" role="alert">
            The database isn’t connected. Set DATABASE_URL and reload — you
            won’t be able to save anything until then.
          </p>
        )}

        {db && rows.length === 0 && (
          <p className="empty-note">
            Nothing written yet. Hit “New post” to start.
          </p>
        )}

        {db && drafts.length > 0 && (
          <QueuePanel
            unscheduled={drafts.length - queued.length}
            scheduled={queued.length}
            nextUp={queued[0]?.scheduledFor ?? null}
          />
        )}

        {rows.length > 0 && (
          <div className="studio-list">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/studio/${row.id}`}
                className="studio-item"
              >
                <div className="studio-item-meta">
                  <span
                    className={`studio-badge ${
                      row.status === "published"
                        ? "is-live"
                        : row.scheduledFor
                          ? "is-queued"
                          : "is-draft"
                    }`}
                  >
                    {row.status === "published"
                      ? "live"
                      : row.scheduledFor
                        ? "queued"
                        : "draft"}
                  </span>
                  <span>{categoryLabels[row.category as Category]}</span>
                  {row.featured && (
                    <span className="studio-star">featured</span>
                  )}
                  <span className="studio-when">
                    {row.status === "draft" && row.scheduledFor
                      ? `goes live ${formatQueued(row.scheduledFor)}`
                      : `edited ${formatDate(row.updatedAt)}`}
                  </span>
                </div>
                <div className="studio-item-title">{row.title}</div>
                <div className="studio-item-slug">/writing/{row.slug}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
