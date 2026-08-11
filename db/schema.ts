import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
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
