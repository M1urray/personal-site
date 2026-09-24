import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { fromDateInput } from "@/lib/schedule";
import { slugify } from "@/lib/slug";

/** Shared shape for creating and updating a post from the studio. */
export const postInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give the post a title — at least 3 characters.")
    .max(160, "That title is longer than 160 characters."),
  slug: z
    .string()
    .trim()
    .max(80, "That slug is longer than 80 characters.")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(300, "Keep the summary under 300 characters.")
    .optional()
    .or(z.literal("")),
  body: z.string().max(200_000, "That post is too long to save.").default(""),
  category: z.enum(CATEGORIES),
  coverUrl: z
    .string()
    .trim()
    .url("That cover image URL doesn’t look right.")
    .optional()
    .or(z.literal("")),
  coverAlt: z
    .string()
    .trim()
    .max(200, "Keep the image description under 200 characters.")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
  featured: z.boolean().default(false),
  /** `yyyy-mm-dd` for the scheduled publisher; "" clears the queue date. */
  scheduledFor: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-14.")
    .optional()
    .or(z.literal("")),
});

export type PostInput = z.infer<typeof postInputSchema>;

/**
 * The queue date, as a column patch.
 *
 * An absent field leaves an existing date alone; an empty string clears it.
 * Same rule as the slug: saving one part of a post must never quietly undo
 * something set somewhere else.
 */
export function scheduledForColumn(input: PostInput): {
  scheduledFor?: Date | null;
} {
  if (input.scheduledFor === undefined) return {};
  return {
    scheduledFor: input.scheduledFor ? fromDateInput(input.scheduledFor) : null,
  };
}

/** Normalise studio input into database columns. */
export function toColumns(input: PostInput) {
  const slug = slugify(input.slug || input.title);
  return {
    slug,
    title: input.title,
    description: input.description ?? "",
    body: input.body ?? "",
    category: input.category,
    coverUrl: input.coverUrl ? input.coverUrl : null,
    coverAlt: input.coverAlt ? input.coverAlt : null,
    status: input.status,
    featured: input.featured,
  };
}
