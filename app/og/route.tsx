import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";
import {
  CARD_SIZE,
  INK,
  OK,
  PAPER,
  SIGNAL,
  STEEL,
  cardFonts,
} from "@/app/og/theme";

export const runtime = "nodejs";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (
    searchParams.get("title") ??
    "I build custom systems in .NET — and connect them to everything else."
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
          {siteConfig.name} — {siteConfig.role}
        </div>
      </div>
    </div>,
    { ...CARD_SIZE, fonts: cardFonts },
  );
}
