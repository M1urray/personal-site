import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const subscriberStatus = pgEnum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);

export const enquiryStatus = pgEnum("enquiry_status", [
  "new",
  "read",
  "replied",
]);

export const postStatus = pgEnum("post_status", ["draft", "published"]);

export const postCategory = pgEnum("post_category", [
  "business-central",
  "dotnet",
  "integration",
]);

/**
 * Blog posts. Authored in the private /studio and stored here so they can be
 * published from anywhere (including a phone) without a redeploy. Bodies are
 * plain Markdown — never MDX — so nothing from the database is ever executed.
 */
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    body: text("body").notNull().default(""),
    category: postCategory("category").notNull().default("business-central"),
    coverUrl: text("cover_url"),
    coverAlt: text("cover_alt"),
    status: postStatus("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("posts_status_published_at_idx").on(table.status, table.publishedAt),
  ],
);

/** Newsletter subscribers — double opt-in, token-based unsubscribe. */
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  status: subscriberStatus("status").notNull().default("pending"),
  source: text("source").notNull().default("site"),
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
});

/** Contact enquiries. IP is stored hashed only — never the raw address. */
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message").notNull(),
  projectType: text("project_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipHash: text("ip_hash"),
  status: enquiryStatus("status").notNull().default("new"),
});

/** Per-post view counts. Posts themselves live in MDX, not the database. */
export const postViews = pgTable("post_views", {
  slug: text("slug").primaryKey(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type PostView = typeof postViews.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
