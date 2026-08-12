import Link from "next/link";
import Image from "next/image";
import { getPublishedPosts, categoryLabels, formatDate } from "@/lib/blog";

/**
 * The homepage writing teaser. Shows the latest posts once any are published;
 * until then it falls back to the approved "In progress" block from the
 * reference design, so the section is never empty.
 */
export async function HomeWriting() {
  const posts = (await getPublishedPosts()).slice(0, 3);

  if (posts.length === 0) {
    return (
      <div className="writing">
        <h3>In progress</h3>
        <p>
          Working notes on Business Central integration — the specific failures,
          error messages and design decisions that only show up once a system is
          in production. Written for the developer who has just pasted an error
          string into a search bar at 2am.
        </p>
        <div className="topics">
          <span className="topic">
            Authenticating to BC OData from .NET after basic auth
          </span>
          <span className="topic">
            Why you shouldn&apos;t replicate ERP data into your portal
          </span>
          <span className="topic">
            Idempotent upserts and the number series trap
          </span>
          <span className="topic">
            BC inside a Linux container — the AD problem
          </span>
          <span className="topic">OData vs SOAP vs API pages</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="sec-note home-writing-note">
        Working notes on Business Central integration — the specific failures,
        error messages and design decisions that only show up once a system is
        in production.
      </p>

      <div className="home-posts">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/writing/${post.slug}`}
            className="home-post"
          >
            {post.coverUrl && (
              <div className="home-post-media">
                <Image
                  src={post.coverUrl}
                  alt={post.coverAlt ?? ""}
                  fill
                  sizes="(max-width: 720px) 100vw, 380px"
                  className="post-card-img"
                />
              </div>
            )}
            <div className="post-meta">
              <span className="post-cat">{categoryLabels[post.category]}</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span>{post.readingTime} min</span>
            </div>
            <h3 className="home-post-title">{post.title}</h3>
            {post.description && (
              <p className="home-post-desc">{post.description}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="cta-row home-writing-cta">
        <Link className="btn" href="/writing">
          All writing
        </Link>
      </div>
    </>
  );
}
