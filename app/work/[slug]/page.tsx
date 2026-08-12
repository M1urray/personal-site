import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCaseStudies, getCaseStudyBySlug } from "@/lib/work";
import { formatDate } from "@/lib/blog";
import { PostBody } from "@/components/PostBody";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllCaseStudies().map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study || !study.published) return {};

  const url = `/work/${study.slug}`;
  const ogImage = `/og?title=${encodeURIComponent(study.title)}&eyebrow=${encodeURIComponent(study.sector)}`;

  return {
    title: study.title,
    description: study.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: study.title,
      description: study.description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: study.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: study.title,
      description: study.description,
      images: [ogImage],
    },
  };
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study || !study.published) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: study.title,
    description: study.description,
    datePublished: new Date(study.date).toISOString(),
    author: { "@type": "Person", name: siteConfig.name, url: siteConfig.url },
    publisher: { "@type": "Person", name: siteConfig.name },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/work/${study.slug}`,
    },
    about: study.sector,
    inLanguage: "en",
  };

  return (
    <article className="article">
      <JsonLd data={articleLd} />

      <Link href="/work" className="back-link">
        ← All work
      </Link>

      <div className="eyebrow">/work</div>
      <h1 className="article-title">{study.title}</h1>

      <div className="article-meta">
        <span className="post-cat">{study.client}</span>
        <span>{study.sector}</span>
        <span>{formatDate(study.date)}</span>
      </div>

      {study.liveUrl && (
        <a className="live" href={study.liveUrl} target="_blank" rel="noopener">
          <span className="dot" />
          {study.liveLabel ?? study.liveUrl}
        </a>
      )}

      <PostBody source={study.content} />

      {study.stack.length > 0 && (
        <div className="stack">
          {study.stack.map((tech) => (
            <span className="chip" key={tech}>
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className="article-foot">
        <Link href="/work" className="back-link">
          ← All work
        </Link>
      </div>
    </article>
  );
}
