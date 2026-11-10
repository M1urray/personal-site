import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fonts and palette for every generated share card. The palette mirrors the
 * :root tokens in globals.css — Satori can't read CSS variables, so the hex
 * values live here once instead of in each card.
 */

const fontsDir = join(process.cwd(), "app", "og", "fonts");

export const cardFonts = [
  {
    name: "Archivo",
    data: readFileSync(join(fontsDir, "Archivo-Bold.ttf")),
    weight: 800 as const,
    style: "normal" as const,
  },
  {
    name: "IBM Plex Mono",
    data: readFileSync(join(fontsDir, "IBMPlexMono-Regular.ttf")),
    weight: 400 as const,
    style: "normal" as const,
  },
];

export const INK = "#0A1017";
export const INK_2 = "#111A24";
export const RULE = "#1E2C3A";
export const PAPER = "#E8EEF3";
export const STEEL = "#6B8299";
export const STEEL_2 = "#8EA1B5";
export const SIGNAL = "#F0A63C";
export const OK = "#4FB89A";

export const CARD_SIZE = { width: 1200, height: 630 } as const;
