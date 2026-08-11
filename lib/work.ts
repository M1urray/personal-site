import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const WORK_DIR = path.join(process.cwd(), "content", "work");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().refine((d) => !Number.isNaN(Date.parse(d)), {
    message: "Invalid ISO date",
  }),
  client: z.string().min(1),
  sector: z.string().min(1),
  liveUrl: z.string().url().optional(),
  liveLabel: z.string().optional(),
  stack: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

export type CaseStudyMeta = z.infer<typeof frontmatterSchema> & {
  slug: string;
};

export type CaseStudy = CaseStudyMeta & { content: string };

function slugs(): string[] {
  if (!fs.existsSync(WORK_DIR)) return [];
  return fs
    .readdirSync(WORK_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getCaseStudyBySlug(slug: string): CaseStudy | null {
  const fullPath = path.join(WORK_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      `Invalid frontmatter in content/work/${slug}.mdx: ${parsed.error.message}`,
    );
  }

  return { ...parsed.data, slug, content };
}

/** All published case studies, newest first, featured pinned to the top. */
export function getAllCaseStudies(): CaseStudy[] {
  return slugs()
    .map((slug) => getCaseStudyBySlug(slug))
    .filter((c): c is CaseStudy => c !== null && c.published)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return Date.parse(b.date) - Date.parse(a.date);
    });
}
