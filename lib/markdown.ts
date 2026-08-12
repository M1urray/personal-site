import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode, { type Options } from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";

const prettyCodeOptions: Options = {
  theme: "github-dark-dimmed",
  keepBackground: false,
  defaultLang: "plaintext",
};

/**
 * Push body headings down one level so a `#` typed in the studio renders as
 * <h2>. The page title is the only <h1>, which keeps heading order valid no
 * matter how the author writes.
 */
function remarkShiftHeadings() {
  return (tree: Root) => {
    visit(tree, "heading", (node) => {
      if (node.depth < 6) node.depth = (node.depth + 1) as typeof node.depth;
    });
  };
}

/**
 * Render a post body written in the studio.
 *
 * This is deliberately Markdown, NOT MDX: post bodies come from the database,
 * and MDX would compile them as JavaScript. `remark-rehype` also drops raw HTML
 * by default (no `allowDangerousHtml`, no `rehype-raw`), so embedded <script>
 * or event handlers are discarded rather than rendered.
 */
export async function renderMarkdown(source: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkShiftHeadings)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify)
    .process(source);

  return String(file);
}

/** First paragraph of a body, for auto-filling an empty summary. */
export function excerpt(source: string, max = 200): string {
  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
