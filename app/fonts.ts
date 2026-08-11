import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

/**
 * Self-hosted at build time by next/font — no render-blocking link to Google.
 * `display: "swap"` plus next/font's automatic fallback-metric adjustment keeps
 * cumulative layout shift from font loading at zero.
 */
export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "800"],
  variable: "--font-archivo",
  display: "swap",
});

export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});
