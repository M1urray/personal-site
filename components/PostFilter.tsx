"use client";

import { useState } from "react";
import Link from "next/link";

export type PostListItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  categoryLabel: string;
  readingTime: number;
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

  return (
    <>
      <div
        className="filters"
        role="group"
        aria-label="Filter posts by category"
      >
        {FILTERS.map((f) => (
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

      {shown.length === 0 ? (
        <p className="empty-note">
          No posts in this category yet — check back soon.
        </p>
      ) : (
        <div className="post-list">
          {shown.map((post) => (
            <Link
              key={post.slug}
              href={`/writing/${post.slug}`}
              className="post-item"
            >
              <div className="post-meta">
                <span className="post-cat">{post.categoryLabel}</span>
                <span>{post.date}</span>
                <span>{post.readingTime} min read</span>
              </div>
              <h2 className="post-title">{post.title}</h2>
              <p className="post-desc">{post.description}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
