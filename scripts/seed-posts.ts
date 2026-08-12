/**
 * One-off import of the seed MDX posts in content/posts/ into the database.
 * Safe to re-run: existing slugs are skipped rather than overwritten.
 *
 *   pnpm db:seed
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.ts";

// Match Next.js: .env.local wins, .env is the fallback.
config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — nothing to seed.");
  process.exit(1);
}

const db = drizzle(neon(url), { schema });
const dir = path.join(process.cwd(), "content", "posts");

if (!fs.existsSync(dir)) {
  console.log("No content/posts directory — nothing to import.");
  process.exit(0);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
let imported = 0;
let skipped = 0;

for (const file of files) {
  const slug = file.replace(/\.mdx$/, "");
  const { data, content } = matter(
    fs.readFileSync(path.join(dir, file), "utf8"),
  );

  const existing = await db
    .select({ id: schema.posts.id })
    .from(schema.posts)
    .where(eq(schema.posts.slug, slug))
    .limit(1);

  if (existing[0]) {
    console.log(`skip   ${slug} (already in the database)`);
    skipped++;
    continue;
  }

  const publishedAt = data.date ? new Date(String(data.date)) : new Date();

  await db.insert(schema.posts).values({
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    body: content.trim(),
    category: (data.category ?? "business-central") as "business-central",
    status: data.published === false ? "draft" : "published",
    featured: false,
    publishedAt: data.published === false ? null : publishedAt,
  });

  console.log(`import ${slug}`);
  imported++;
}

console.log(`\nDone — ${imported} imported, ${skipped} skipped.`);
process.exit(0);
