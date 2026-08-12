"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type PostListItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  categoryLabel: string;
  readingTime: number;
  coverUrl?: string | null;
  coverAlt?: string | null;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "business-central", label: "Business Central" },
  { key: "dotnet", label: ".NET" },
  { key: "integration", label: "Integration" },
] as const;

export function PostFilter({ posts }: { posts: PostListItem[] }) {
  const [active, setActive] = useState<string>("all");
  const shown =
    active === "all" ? posts : posts.filter((p) => p.category === active);

  // Only offer a filter if there is something behind it.
  const available = FILTERS.filter(
    (f) => f.key === "all" || posts.some((p) => p.category === f.key),
  );

  return (
    <>
      {available.length > 2 && (
        <div
          className="filters"
          role="group"
          aria-label="Filter posts by category"
        >
          {available.map((f) => (
            <button
              key={f.key}
              type="button"
              className="filter"
              aria-pressed={active === f.key}
              onClick={() => setActive(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="empty-note">
          No posts in this category yet — check back soon.
        </p>
      ) : (
        <div className="post-grid">
          {shown.map((post) => (
            <Link
              key={post.slug}
              href={`/writing/${post.slug}`}
              className="post-card"
            >
              <div className="post-card-media">
                {post.coverUrl ? (
                  <Image
                    src={post.coverUrl}
                    alt={post.coverAlt ?? ""}
                    fill
                    sizes="(max-width: 720px) 100vw, 560px"
                    className="post-card-img"
                  />
                ) : (
                  <span className="post-card-ph" aria-hidden="true">
                    {post.categoryLabel}
                  </span>
                )}
              </div>
              <div className="post-card-copy">
                <div className="post-meta">
                  <span className="post-cat">{post.categoryLabel}</span>
                  <span>{post.date}</span>
                  <span>{post.readingTime} min</span>
                </div>
                <h3 className="post-title">{post.title}</h3>
                {post.description && (
                  <p className="post-desc">{post.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
