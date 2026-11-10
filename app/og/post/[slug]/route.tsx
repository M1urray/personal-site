import { getPublishedPost } from "@/lib/blog";
import { renderPostCard } from "@/app/og/post-card";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Public share card for a published post — what LinkedIn, the RSS feed and
 * the /writing cards show.
 *
 * Published posts only. A draft's card would print its code on a public URL,
 * which is a preview of unpublished writing; the studio has its own
 * signed-in route for that.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) {
    // Never let a CDN remember the 404: the same URL becomes valid the moment
    // the scheduler publishes the post.
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return renderPostCard(post, {
    // Not the ImageResponse default of `immutable, max-age=1y`: the URL is
    // keyed by slug alone, so an edited post has to be able to refresh.
    "Cache-Control":
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  });
}
