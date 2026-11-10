/**
 * Chooses the code excerpt shown on a post's share card.
 *
 * The articles usually show the trap first and the fix last ("// Tempting,
 * and a trap." … "Make the engine collect everything once:"). A card that
 * quoted the first block would put the anti-pattern under the author's name,
 * so the default is the LAST block in the preferred language.
 *
 * An author can override that by tagging a fence with `card`:
 *
 *     ```csharp card
 */

export type CardSnippet = {
  lang: string;
  code: string;
  /** More lines followed than the card shows. */
  truncated: boolean;
};

/** Lines the card has room for. */
export const CARD_MAX_LINES = 7;

type Fence = { lang: string; meta: string; code: string };

const PREFERRED_LANGS = new Set(["csharp", "cs", "c#"]);

/** Languages whose blocks are output or prose, not code worth showing. */
const NON_CODE_LANGS = new Set(["", "text", "plain", "plaintext", "txt"]);

/** Every fenced block in document order. Handles ``` and ~~~ fences. */
function fences(markdown: string): Fence[] {
  const found: Fence[] = [];
  const re = /^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^\1[ \t]*$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown))) {
    const [lang = "", ...rest] = (match[2] ?? "").trim().split(/\s+/);
    found.push({
      lang: lang.toLowerCase(),
      meta: rest.join(" "),
      code: match[3] ?? "",
    });
  }
  return found;
}

function pick(blocks: Fence[]): Fence | undefined {
  const tagged = blocks.find((b) => /(^|\s)card(\s|$)/.test(b.meta));
  if (tagged) return tagged;

  const last = <T>(xs: T[]) => xs[xs.length - 1];
  return (
    last(blocks.filter((b) => PREFERRED_LANGS.has(b.lang))) ??
    last(blocks.filter((b) => !NON_CODE_LANGS.has(b.lang))) ??
    last(blocks)
  );
}

/**
 * Trim a block to what reads well at card size: drop `using` lines, strip the
 * common indent, collapse blank runs, and keep the first CARD_MAX_LINES.
 */
function tidy(code: string): { lines: string[]; truncated: boolean } {
  let lines = code
    .replace(/\t/g, "    ")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""));

  // Imports are noise on a thumbnail — the interesting part starts after them.
  // Namespace directives only: `using var x = …` is a statement worth keeping.
  const isImport = (line: string) =>
    /^\s*using\s+(static\s+)?[\w.]+(\s*=\s*[\w.<>, ]+)?\s*;\s*$/.test(line) ||
    /^\s*import\s.+\sfrom\s.+$|^\s*import\s+["'].+["'];?\s*$/.test(line);

  while (lines.length && (isImport(lines[0]!) || lines[0]!.trim() === "")) {
    lines.shift();
  }

  lines = lines.filter((line, i) => !(line === "" && lines[i - 1] === ""));
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^ */)![0].length);
  const common = indents.length ? Math.min(...indents) : 0;
  lines = lines.map((line) => line.slice(common));

  return {
    lines: lines.slice(0, CARD_MAX_LINES),
    truncated: lines.length > CARD_MAX_LINES,
  };
}

export function cardSnippet(markdown: string): CardSnippet | null {
  const block = pick(fences(markdown));
  if (!block) return null;

  const { lines, truncated } = tidy(block.code);
  if (lines.length === 0) return null;

  return { lang: block.lang, code: lines.join("\n"), truncated };
}
