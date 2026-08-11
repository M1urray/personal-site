import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export const CATEGORIES = [
  "business-central",
  "dotnet",
  "integration",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const categoryLabels: Record<Category, string> = {
  "business-central": "Business Central",
  dotnet: ".NET",
  integration: "Integration",
};

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().refine((d) => !Number.isNaN(Date.parse(d)), {
    message: "Invalid ISO date",
  }),
  category: z.enum(CATEGORIES),
  published: z.boolean().default(true),
  author: z.string().default("Robert Kamau Njonjo"),
});

export type PostMeta = z.infer<typeof frontmatterSchema> & {
  slug: string;
  readingTime: number;
};

export type Post = PostMeta & { content: string };

function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function postSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      `Invalid frontmatter in content/posts/${slug}.mdx: ${parsed.error.message}`,
    );
  }

  return {
    ...parsed.data,
    slug,
    readingTime: readingTime(content),
    content,
  };
}

/** All published posts, newest first. */
export function getAllPosts(): Post[] {
  return postSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is Post => p !== null && p.published)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function getPostsByCategory(category: Category): Post[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function isCategory(value: string | undefined): value is Category {
  return (CATEGORIES as readonly string[]).includes(value ?? "");
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}
