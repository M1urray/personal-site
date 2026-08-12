import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — comfortably fits phone photos
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export function GET() {
  // Lets the studio tell the author up front whether uploads will work.
  return NextResponse.json({
    enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Image storage isn’t connected yet. Create a Blob store in Vercel, or paste an image URL instead.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Couldn’t read that upload." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "No image was attached." },
      { status: 400 },
    );
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      {
        ok: false,
        message: "That file type isn’t supported. Use JPEG, PNG, WebP or GIF.",
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return NextResponse.json(
      {
        ok: false,
        message: `That image is ${mb} MB — the limit is 8 MB. Try a smaller one.`,
      },
      { status: 413 },
    );
  }

  const dot = file.name.lastIndexOf(".");
  const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "jpg";
  const name = `${slugify(stem) || "image"}.${ext}`;

  try {
    const blob = await put(`posts/${name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("[studio] upload failed:", err);
    return NextResponse.json(
      { ok: false, message: "Upload failed. Please try again." },
      { status: 502 },
    );
  }
}
