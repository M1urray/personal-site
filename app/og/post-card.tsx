import { ImageResponse } from "next/og";
import {
  createHighlighter,
  type BundledLanguage,
  type Highlighter,
  type SpecialLanguage,
} from "shiki";
import { cardSnippet, type CardSnippet } from "@/lib/card-snippet";
import { categoryLabels, isCategory } from "@/lib/categories";
import { siteConfig } from "@/lib/site";
import {
  CARD_SIZE,
  INK,
  INK_2,
  OK,
  PAPER,
  RULE,
  SIGNAL,
  STEEL,
  STEEL_2,
  cardFonts,
} from "@/app/og/theme";

/**
 * The share card for a single post: title, plus the code the post is about.
 *
 * A title on a dark background says nothing a feed reader can't get from the
 * link text under it. A few lines of the actual C# tell a developer scrolling
 * LinkedIn what they'd be clicking into — which is the job of the image. It's
 * generated from the post body, so every post gets one with no extra work,
 * and an uploaded cover still wins when there is one.
 */

/** Same theme as the article's own code blocks, so the card matches the page. */
const THEME = "github-dark-dimmed";

const LANGS = [
  "csharp",
  "sql",
  "typescript",
  "tsx",
  "javascript",
  "json",
  "xml",
  "bash",
  "yaml",
] as const;

const ALIASES: Record<string, string> = {
  cs: "csharp",
  "c#": "csharp",
  ts: "typescript",
  js: "javascript",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
};

/** Columns the code panel has room for at CODE_SIZE. */
const MAX_COLS = 78;
const CODE_SIZE = 21;

// One highlighter per server instance — building it loads grammars, which is
// the slow part of rendering a card.
let highlighter: Promise<Highlighter> | undefined;
function getHighlighter() {
  return (highlighter ??= createHighlighter({
    themes: [THEME],
    langs: [...LANGS],
  }));
}

type Token = { content: string; color: string };

async function tokenize(snippet: CardSnippet): Promise<Token[][]> {
  const hl = await getHighlighter();
  const wanted = ALIASES[snippet.lang] ?? snippet.lang;
  // Anything not loaded renders uncoloured rather than failing the card.
  const lang = (hl.getLoadedLanguages().includes(wanted) ? wanted : "text") as
    BundledLanguage | SpecialLanguage;

  // Highlight whole lines first, truncate after: cutting a line mid-string
  // before tokenizing would leave the string "open" and colour every line
  // below it as a literal.
  const { tokens, fg } = hl.codeToTokens(snippet.code, { lang, theme: THEME });
  const base = fg ?? PAPER;

  return tokens.map((line) => {
    const out: Token[] = [];
    let width = 0;
    for (const token of line) {
      const room = MAX_COLS - 1 - width;
      if (token.content.length <= room) {
        out.push({ content: token.content, color: token.color ?? base });
        width += token.content.length;
        continue;
      }
      out.push({
        content: token.content.slice(0, Math.max(0, room)),
        color: token.color ?? base,
      });
      out.push({ content: "…", color: STEEL });
      break;
    }
    return out;
  });
}

export type CardPost = {
  title: string;
  description: string;
  body: string;
  category: string;
  readingTime: number;
};

export async function renderPostCard(
  post: CardPost,
  headers: Record<string, string>,
): Promise<ImageResponse> {
  const snippet = cardSnippet(post.body);
  const lines = snippet ? await tokenize(snippet) : null;

  const eyebrow = (
    isCategory(post.category) ? categoryLabels[post.category] : post.category
  ).toUpperCase();

  const title = post.title.slice(0, 140);
  const titleSize = title.length > 64 ? 42 : title.length > 44 ? 48 : 56;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: INK,
        color: PAPER,
        fontFamily: "Archivo",
      }}
    >
      <div style={{ height: 8, background: SIGNAL, display: "flex" }} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 64px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "IBM Plex Mono",
          }}
        >
          <div style={{ fontSize: 22, color: SIGNAL, letterSpacing: 2 }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 20, color: STEEL, letterSpacing: 1 }}>
            {`${post.readingTime} MIN READ`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: -1,
            maxWidth: 1072,
          }}
        >
          {title}
        </div>

        {lines ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: INK_2,
              border: `1px solid ${RULE}`,
              borderLeft: `3px solid ${SIGNAL}`,
              padding: "18px 26px",
              fontFamily: "IBM Plex Mono",
              fontSize: CODE_SIZE,
              lineHeight: 1.45,
            }}
          >
            {lines.map((line, i) => (
              <div
                key={i}
                style={{ display: "flex", whiteSpace: "pre", minHeight: 30 }}
              >
                {line.map((token, j) => (
                  <span key={j} style={{ color: token.color }}>
                    {token.content}
                  </span>
                ))}
              </div>
            ))}
            {snippet?.truncated && (
              <div style={{ display: "flex", color: STEEL }}>…</div>
            )}
          </div>
        ) : (
          // No code in the post: show its summary instead, so the card still
          // says what the post is about rather than repeating the title.
          <div
            style={{
              display: "flex",
              background: INK_2,
              border: `1px solid ${RULE}`,
              borderLeft: `3px solid ${SIGNAL}`,
              padding: "22px 28px",
              fontFamily: "IBM Plex Mono",
              fontSize: 24,
              lineHeight: 1.5,
              color: STEEL_2,
            }}
          >
            {post.description.slice(0, 220)}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: "IBM Plex Mono",
            fontSize: 20,
            color: STEEL,
            letterSpacing: 0.5,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              background: OK,
              borderRadius: 5,
              display: "flex",
            }}
          />
          {`${siteConfig.name} — ${siteConfig.role}`}
        </div>
      </div>
    </div>,
    { ...CARD_SIZE, fonts: cardFonts, headers },
  );
}
