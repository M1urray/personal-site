/**
 * Blog categories. Kept free of server-only imports so both the public pages
 * and the client-side studio editor can use them.
 */
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

export function isCategory(value: string | undefined): value is Category {
  return (CATEGORIES as readonly string[]).includes(value ?? "");
}
