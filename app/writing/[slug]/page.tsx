import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPosts,
  getPostBySlug,
  categoryLabels,
  formatDate,
} from "@/lib/posts";
import { PostBody } from "@/components/PostBody";
import { JsonLd } from "@/components/JsonLd";
import { ViewCounter } from "@/components/ViewCounter";
import { siteConfig } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.published) return {};

  const url = `/writing/${post.slug}`;
  const ogImage = `/og?title=${encodeURIComponent(post.title)}&eyebrow=${post.category}`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
      url: siteConfig.url,
    },
    publisher: { "@type": "Person", name: siteConfig.name },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/writing/${post.slug}`,
    },
    url: `${siteConfig.url}/writing/${post.slug}`,
    articleSection: categoryLabels[post.category],
    inLanguage: "en",
  };

  return (
    <article className="article">
      <JsonLd data={blogLd} />

      <Link href="/writing" className="back-link">
        ← All writing
      </Link>

      <div className="eyebrow">/writing</div>
      <h1 className="article-title">{post.title}</h1>
      <div className="article-meta">
        <span className="post-cat">{categoryLabels[post.category]}</span>
        <span>{formatDate(post.date)}</span>
        <span>{post.readingTime} min read</span>
        <ViewCounter slug={post.slug} />
      </div>

      <PostBody source={post.content} />

      <div className="article-foot">
        <Link href="/writing" className="back-link">
          ← All writing
        </Link>
      </div>
    </article>
  );
}
