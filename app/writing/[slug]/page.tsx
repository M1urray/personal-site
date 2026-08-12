import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getPublishedPost,
  getPublishedPosts,
  getRelatedPosts,
  categoryLabels,
  formatDate,
} from "@/lib/blog";
import { MarkdownBody } from "@/components/MarkdownBody";
import { JsonLd } from "@/components/JsonLd";
import { ViewCounter } from "@/components/ViewCounter";
import { siteConfig } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

/** Pre-render known posts; new ones render on first request and then cache. */
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return {};

  const url = `/writing/${post.slug}`;
  const ogImage =
    post.coverUrl ??
    `/og?title=${encodeURIComponent(post.title)}&eyebrow=${post.category}`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [siteConfig.name],
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
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.slug, post.category);

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: siteConfig.name, url: siteConfig.url },
    publisher: { "@type": "Person", name: siteConfig.name },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/writing/${post.slug}`,
    },
    url: `${siteConfig.url}/writing/${post.slug}`,
    articleSection: categoryLabels[post.category],
    inLanguage: "en",
    ...(post.coverUrl ? { image: post.coverUrl } : {}),
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
        <span>{formatDate(post.publishedAt)}</span>
        <span>{post.readingTime} min read</span>
        <ViewCounter slug={post.slug} />
      </div>

      {post.coverUrl && (
        <div className="article-cover">
          <Image
            src={post.coverUrl}
            alt={post.coverAlt ?? ""}
            width={1200}
            height={630}
            sizes="(max-width: 800px) 100vw, 760px"
            className="article-cover-img"
            priority
          />
        </div>
      )}

      <MarkdownBody source={post.body} />

      {related.length > 0 && (
        <section className="read-next" aria-labelledby="read-next">
          <h2 className="read-next-head" id="read-next">
            Read next
          </h2>
          <div className="read-next-grid">
            {related.map((next) => (
              <Link
                key={next.slug}
                href={`/writing/${next.slug}`}
                className="mini next-card"
              >
                <div className="post-meta">
                  <span className="post-cat">
                    {categoryLabels[next.category]}
                  </span>
                  <span>{next.readingTime} min</span>
                </div>
                <h3 className="next-title">{next.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="article-foot">
        <Link href="/writing" className="back-link">
          ← All writing
        </Link>
      </div>
    </article>
  );
}
