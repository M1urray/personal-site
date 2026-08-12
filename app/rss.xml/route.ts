import { getPublishedPosts, categoryLabels } from "@/lib/blog";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

const escapeMap: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => escapeMap[c] ?? c);
}

export async function GET() {
  const base = siteConfig.url;
  const posts = await getPublishedPosts();

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${base}/writing/${post.slug}</link>
      <guid isPermaLink="true">${base}/writing/${post.slug}</guid>
      <pubDate>${post.publishedAt.toUTCString()}</pubDate>
      <category>${escapeXml(categoryLabels[post.category])}</category>
      <description>${escapeXml(post.description)}</description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${siteConfig.name} — Writing`)}</title>
    <link>${base}/writing</link>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml("Working notes on Business Central integration.")}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
