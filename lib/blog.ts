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
 * An unreachable database is an operational problem, not a bug in a query, and
 * it happens on every read — so dumping the full SQL at each call site buries
 * the one fact that matters. Report it once, as a warning with the fix in it,
 * and keep the loud stack traces for errors that are genuinely unexpected.
 */
let connectionProblemReported = false;

const CONNECTION_FAILURE =
  /password authentication failed|could not connect|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|terminating connection|connection terminated|timeout|SSL/i;

/**
 * Drizzle wraps driver errors, so the useful text ("password authentication
 * failed") is on `cause`, not on the error itself. Walk the chain.
 */
function messageChain(err: unknown): string[] {
  const parts: string[] = [];
  let current: unknown = err;

  for (let depth = 0; current && depth < 5; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = (current as { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }

  return parts;
}

function reportDbError(operation: string, err: unknown): void {
  const chain = messageChain(err);

  if (chain.some((m) => CONNECTION_FAILURE.test(m))) {
    if (!connectionProblemReported) {
      connectionProblemReported = true;
      // The root cause is the useful one; the outer frames are just the query.
      const rootCause = chain.at(-1) ?? "unknown";
      console.warn(
        `[blog] Database unreachable — the blog is rendering empty. ` +
          `Check DATABASE_URL (a Neon password reset invalidates the old one). ` +
          `Cause: ${rootCause}`,
      );
    }
    return;
  }

  console.error(`[blog] ${operation} failed:`, err);
}

/** Called after a successful read so a later outage is reported again. */
function noteDbReachable(): void {
  connectionProblemReported = false;
}

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
    noteDbReachable();
    return rows.map(toBlogPost);
  } catch (err) {
    reportDbError("getPublishedPosts", err);
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
    noteDbReachable();
    return rows[0] ? toBlogPost(rows[0]) : null;
  } catch (err) {
    reportDbError("getPublishedPost", err);
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
    noteDbReachable();
    return rows.map(toBlogPost);
  } catch (err) {
    reportDbError("getRelatedPosts", err);
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
