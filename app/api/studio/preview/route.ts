import { NextResponse } from "next/server";
import { renderMarkdown } from "@/lib/markdown";

export const runtime = "nodejs";

/** Renders draft Markdown with the exact pipeline the published page uses. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ html: "" }, { status: 400 });
  }

  const source = (body as { body?: unknown })?.body;
  if (typeof source !== "string" || source.trim() === "") {
    return NextResponse.json({ html: "" });
  }

  try {
    return NextResponse.json({ html: await renderMarkdown(source) });
  } catch (err) {
    console.error("[studio] preview failed:", err);
    return NextResponse.json(
      { html: "<p>Couldn’t render this Markdown.</p>" },
      { status: 500 },
    );
  }
}
