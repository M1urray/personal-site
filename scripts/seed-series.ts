/**
 * Seeds the article series into the database as DRAFTS.
 *
 *   pnpm series:seed            # insert missing, leave existing alone
 *   pnpm series:seed -- --force # also overwrite drafts that already exist
 *
 * Drafts on purpose: these go out under your name, so every one gets read in
 * /studio before it is published. Nothing here publishes anything.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.ts";
import { series } from "../content/series/dotnet-lessons.ts";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — nothing to seed.");
  process.exit(1);
}

const force = process.argv.includes("--force");
const db = drizzle(neon(url), { schema });

let inserted = 0;
let updated = 0;
let skipped = 0;

for (const article of series) {
  const existing = await db
    .select({ id: schema.posts.id, status: schema.posts.status })
    .from(schema.posts)
    .where(eq(schema.posts.slug, article.slug))
    .limit(1);

  const row = existing[0];

  if (row && !force) {
    console.log(`skip     ${article.slug}`);
    skipped++;
    continue;
  }

  if (row) {
    // Never quietly rewrite something already live.
    if (row.status === "published") {
      console.log(`skip     ${article.slug} (published — edit it in /studio)`);
      skipped++;
      continue;
    }
    await db
      .update(schema.posts)
      .set({
        title: article.title,
        description: article.description,
        body: article.body,
        category: article.category,
        updatedAt: new Date(),
      })
      .where(eq(schema.posts.id, row.id));
    console.log(`update   ${article.slug}`);
    updated++;
    continue;
  }

  await db.insert(schema.posts).values({
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    category: article.category,
    status: "draft",
    featured: false,
    publishedAt: null,
  });
  console.log(`insert   ${article.slug}`);
  inserted++;
}

console.log(
  `\n${series.length} articles — ${inserted} inserted, ${updated} updated, ${skipped} skipped.`,
);
console.log("All drafts. Review in /studio, then publish.");
process.exit(0);
