import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode, { type Options } from "rehype-pretty-code";

const prettyCodeOptions: Options = {
  theme: "github-dark-dimmed",
  keepBackground: false,
  defaultLang: "plaintext",
};

const mdxComponents = {
  a: ({ href = "", ...props }: ComponentPropsWithoutRef<"a">) => {
    if (href.startsWith("/") || href.startsWith("#")) {
      return <Link href={href} {...props} />;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
    );
  },
};

/** Renders MDX post content as an RSC — no client JS shipped for the body. */
export function PostBody({ source }: { source: string }) {
  return (
    <div className="prose">
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
          },
        }}
      />
    </div>
  );
}
