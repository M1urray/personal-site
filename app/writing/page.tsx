import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  getPublishedPosts,
  categoryLabels,
  formatDate,
  type BlogPost,
} from "@/lib/blog";
import { PostFilter, type PostListItem } from "@/components/PostFilter";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { newsletterEnabled } from "@/lib/env";

const description =
  "Working notes on Business Central integration — the specific failures, error messages and design decisions that only show up once a system is in production.";

export const metadata: Metadata = {
  title: "Writing",
  description,
  alternates: {
    canonical: "/writing",
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    title: "Writing — Robert Kamau Njonjo",
    description,
    url: "/writing",
  },
};

/** Re-rendered on demand when a post is published; hourly otherwise. */
export const revalidate = 3600;

function toListItem(post: BlogPost): PostListItem {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: formatDate(post.publishedAt),
    category: post.category,
    categoryLabel: categoryLabels[post.category],
    readingTime: post.readingTime,
    coverUrl: post.coverUrl,
    coverAlt: post.coverAlt,
  };
}

export default async function WritingPage() {
  const all = await getPublishedPosts();
  const featured = all.find((p) => p.featured) ?? all[0] ?? null;
  const rest = featured ? all.filter((p) => p.slug !== featured.slug) : all;

  return (
    <div className="page">
      <div className="sec-head">
        <div className="eyebrow">/writing</div>
        <h1>Notes from the seam</h1>
        <p className="sec-note">{description}</p>
      </div>

      {all.length === 0 ? (
        <p className="empty-note">
          The first posts are on their way — check back soon.
        </p>
      ) : (
        <>
          {featured && (
            <Link href={`/writing/${featured.slug}`} className="lead">
              {featured.coverUrl && (
                <div className="lead-media">
                  <Image
                    src={featured.coverUrl}
                    alt={featured.coverAlt ?? ""}
                    fill
                    sizes="(max-width: 860px) 100vw, 1180px"
                    className="lead-img"
                    priority
                  />
                </div>
              )}
              <div className="lead-copy">
                <div className="post-meta">
                  <span className="post-cat">
                    {categoryLabels[featured.category]}
                  </span>
                  <span>{formatDate(featured.publishedAt)}</span>
                  <span>{featured.readingTime} min read</span>
                </div>
                <h2 className="lead-title">{featured.title}</h2>
                {featured.description && (
                  <p className="lead-desc">{featured.description}</p>
                )}
                <span className="work-more">Read it →</span>
              </div>
            </Link>
          )}

          {rest.length > 0 && <PostFilter posts={rest.map(toListItem)} />}
        </>
      )}

      <NewsletterSignup enabled={newsletterEnabled()} />
    </div>
  );
}
