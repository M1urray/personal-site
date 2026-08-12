import { renderMarkdown } from "@/lib/markdown";

/**
 * Renders a studio-authored post body. The HTML comes from our own Markdown
 * pipeline, which drops raw HTML and never executes anything from the
 * database — see lib/markdown.ts.
 */
export async function MarkdownBody({ source }: { source: string }) {
  const html = await renderMarkdown(source);
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
