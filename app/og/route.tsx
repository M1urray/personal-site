import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";

const fontsDir = join(process.cwd(), "app", "og", "fonts");
const archivo = readFileSync(join(fontsDir, "Archivo-Bold.ttf"));
const plexMono = readFileSync(join(fontsDir, "IBMPlexMono-Regular.ttf"));

const INK = "#0A1017";
const PAPER = "#E8EEF3";
const STEEL = "#6B8299";
const SIGNAL = "#F0A63C";
const OK = "#4FB89A";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (
    searchParams.get("title") ??
    "I connect Microsoft Dynamics 365 Business Central to everything else."
  ).slice(0, 140);
  const eyebrow = (searchParams.get("eyebrow") ?? "robertnjonjo.com")
    .slice(0, 40)
    .toUpperCase();

  const titleSize = title.length > 84 ? 52 : title.length > 52 ? 62 : 74;

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
        position: "relative",
      }}
    >
      <div style={{ height: 8, background: SIGNAL, display: "flex" }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "IBM Plex Mono",
              fontSize: 24,
              color: SIGNAL,
              letterSpacing: 2,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: "IBM Plex Mono",
              fontSize: 22,
              color: STEEL,
              letterSpacing: 1,
            }}
          >
            R.NJONJO
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            lineHeight: 1.06,
            fontWeight: 800,
            letterSpacing: -1.5,
            maxWidth: 1010,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: "IBM Plex Mono",
            fontSize: 22,
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
          Robert Kamau Njonjo — Business Central Integration Engineer
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "IBM Plex Mono", data: plexMono, weight: 400, style: "normal" },
      ],
    },
  );
}
