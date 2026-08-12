import "server-only";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import type { Category } from "@/lib/categories";

// Re-exported so server components can pull everything from one module.
export {
  CATEGORIES,
  categoryLabels,
  isCategory,
  type Category,
} from "@/lib/categories";

/** A published post as the public site consumes it. */
export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  category: Category;
  coverUrl: string | null;
  coverAlt: string | null;
  featured: boolean;
  publishedAt: Date;
  updatedAt: Date;
  readingTime: number;
};

/** Words per minute used for the read-time estimate. */
const WPM = 200;

export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WPM));
}

type Row = typeof posts.$inferSelect;

function toBlogPost(row: Row): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body,
    category: row.category as Category,
    coverUrl: row.coverUrl,
    coverAlt: row.coverAlt,
    featured: row.featured,
    // Published rows always carry publishedAt; fall back defensively.
    publishedAt: row.publishedAt ?? row.createdAt,
    updatedAt: row.updatedAt,
    readingTime: readingTime(row.body),
  };
}

const publishedOnly = eq(posts.status, "published");

/**
 * All published posts, newest first. Returns [] when no database is
 * configured so the site still builds and renders.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(posts)
      .where(publishedOnly)
      .orderBy(desc(posts.publishedAt));
    return rows.map(toBlogPost);
  } catch (err) {
    console.error("[blog] getPublishedPosts failed:", err);
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const rows = await db
      .select()
      .from(posts)
      .where(and(publishedOnly, eq(posts.slug, slug)))
      .limit(1);
    return rows[0] ? toBlogPost(rows[0]) : null;
  } catch (err) {
    console.error("[blog] getPublishedPost failed:", err);
    return null;
  }
}

/** The pinned post for the top of /writing — newest featured, else newest. */
export async function getFeaturedPost(): Promise<BlogPost | null> {
  const all = await getPublishedPosts();
  return all.find((p) => p.featured) ?? all[0] ?? null;
}

/** Up to `limit` other posts, preferring the same category. */
export async function getRelatedPosts(
  slug: string,
  category: Category,
  limit = 2,
): Promise<BlogPost[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select()
      .from(posts)
      .where(and(publishedOnly, ne(posts.slug, slug)))
      .orderBy(
        // same category first, then newest
        sql`(${posts.category} = ${category}) desc`,
        desc(posts.publishedAt),
      )
      .limit(limit);
    return rows.map(toBlogPost);
  } catch (err) {
    console.error("[blog] getRelatedPosts failed:", err);
    return [];
  }
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(date: Date | string): string {
  return dateFmt.format(typeof date === "string" ? new Date(date) : date);
}
