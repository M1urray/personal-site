import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getPublishedPosts } from "@/lib/blog";
import { getAllCaseStudies } from "@/lib/work";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/work`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/writing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/cv`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];

  const cases: MetadataRoute.Sitemap = getAllCaseStudies().map((study) => ({
    url: `${base}/work/${study.slug}`,
    lastModified: new Date(study.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const posts: MetadataRoute.Sitemap = (await getPublishedPosts()).map(
    (post) => ({
      url: `${base}/writing/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );

  return [...staticRoutes, ...cases, ...posts];
}
