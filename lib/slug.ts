/**
 * Turn a title into a URL-safe slug. Shared by the studio and the API.
 *
 * NFKD splits accented characters into base letter + combining mark, and the
 * [^a-z0-9] pass then drops the marks — so "Café" becomes "cafe".
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // drop combining marks left by NFKD
    .toLowerCase()
    .replace(/['’]/g, "") // drop apostrophes rather than hyphenating them
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
