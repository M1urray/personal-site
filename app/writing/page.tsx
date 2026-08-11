import type { Metadata } from "next";
import { getAllPosts, categoryLabels, formatDate } from "@/lib/posts";
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

export default function WritingPage() {
  const posts: PostListItem[] = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: formatDate(post.date),
    category: post.category,
    categoryLabel: categoryLabels[post.category],
    readingTime: post.readingTime,
  }));

  return (
    <div className="page">
      <div className="sec-head">
        <div className="eyebrow">/writing</div>
        <h1>Notes from the seam</h1>
        <p className="sec-note">{description}</p>
      </div>

      <PostFilter posts={posts} />

      <NewsletterSignup enabled={newsletterEnabled()} />
    </div>
  );
}
