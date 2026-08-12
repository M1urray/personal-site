"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, categoryLabels } from "@/lib/categories";
import { slugify } from "@/lib/slug";

export type EditorPost = {
  id: number | null;
  title: string;
  slug: string;
  description: string;
  body: string;
  category: string;
  coverUrl: string;
  coverAlt: string;
  status: "draft" | "published";
  featured: boolean;
};

const EMPTY: EditorPost = {
  id: null,
  title: "",
  slug: "",
  description: "",
  body: "",
  category: "business-central",
  coverUrl: "",
  coverAlt: "",
  status: "draft",
  featured: false,
};

type Tab = "write" | "preview";

export function PostEditor({ initial }: { initial?: Partial<EditorPost> }) {
  const router = useRouter();
  const [post, setPost] = useState<EditorPost>({ ...EMPTY, ...initial });
  const [tab, setTab] = useState<Tab>("write");
  const [preview, setPreview] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadsEnabled, setUploadsEnabled] = useState(true);
  // Only auto-derive the slug until the author edits it or the post exists.
  const slugTouched = useRef(Boolean(initial?.slug));
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const set = <K extends keyof EditorPost>(key: K, value: EditorPost[K]) =>
    setPost((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    fetch("/api/studio/upload")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { enabled?: boolean } | null) => {
        if (d && d.enabled === false) setUploadsEnabled(false);
      })
      .catch(() => setUploadsEnabled(false));
  }, []);

  // Render the preview server-side so it matches the published page exactly.
  useEffect(() => {
    if (tab !== "preview") return;
    let active = true;
    setPreviewLoading(true);
    fetch("/api/studio/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: post.body }),
    })
      .then((r) => r.json())
      .then((d: { html?: string }) => {
        if (active) setPreview(d.html ?? "");
      })
      .catch(() => {
        if (active) setPreview("<p>Couldn’t render the preview.</p>");
      })
      .finally(() => active && setPreviewLoading(false));
    return () => {
      active = false;
    };
  }, [tab, post.body]);

  function onTitle(value: string) {
    set("title", value);
    if (!slugTouched.current) set("slug", slugify(value));
  }

  /** Insert text at the cursor so uploads land where the author is typing. */
  function insertAtCursor(snippet: string) {
    const el = bodyRef.current;
    if (!el) {
      set("body", `${post.body}\n\n${snippet}\n`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${post.body.slice(0, start)}${snippet}${post.body.slice(end)}`;
    set("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  }

  async function uploadImage(file: File, asCover: boolean) {
    setUploading(true);
    setBanner("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/studio/upload", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        url?: string;
        message?: string;
      };

      if (res.ok && json.ok && json.url) {
        if (asCover) {
          set("coverUrl", json.url);
        } else {
          insertAtCursor(`\n![](${json.url})\n`);
        }
        setNotice("Image uploaded.");
      } else {
        setBanner(json.message ?? "Upload failed.");
      }
    } catch {
      setBanner("Upload failed — check your connection.");
    } finally {
      setUploading(false);
    }
  }

  async function save(status: "draft" | "published") {
    setSaving(true);
    setErrors({});
    setBanner("");
    setNotice("");

    const payload = { ...post, status };
    const editing = post.id !== null;

    try {
      const res = await fetch(
        editing ? `/api/studio/posts/${post.id}` : "/api/studio/posts",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        fieldErrors?: Record<string, string>;
        post?: { id: number; slug: string };
      };

      if (res.ok && json.ok) {
        setPost((p) => ({ ...p, status }));
        setNotice(
          status === "published"
            ? "Published — it’s live on the site now."
            : "Draft saved.",
        );
        if (!editing && json.post) {
          router.replace(`/studio/${json.post.id}`);
        }
        router.refresh();
      } else {
        setBanner(json.message ?? "Couldn’t save that.");
        if (json.fieldErrors) setErrors(json.fieldErrors);
      }
    } catch {
      setBanner("Couldn’t reach the server. Your text is still here — retry.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (post.id === null) return;
    if (!confirm("Delete this post? This can’t be undone.")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/studio/posts/${post.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.replace("/studio");
        router.refresh();
      } else {
        const json = (await res.json()) as { message?: string };
        setBanner(json.message ?? "Couldn’t delete that post.");
        setSaving(false);
      }
    } catch {
      setBanner("Couldn’t reach the server.");
      setSaving(false);
    }
  }

  return (
    <div className="editor">
      <div className="editor-head">
        <input
          className="editor-title"
          placeholder="Post title"
          value={post.title}
          onChange={(e) => onTitle(e.target.value)}
          aria-label="Post title"
        />
        <div className="editor-status">
          <span
            className={`studio-badge ${
              post.status === "published" ? "is-live" : "is-draft"
            }`}
          >
            {post.status === "published" ? "live" : "draft"}
          </span>
          {post.slug && (
            <span className="editor-slug">/writing/{post.slug}</span>
          )}
        </div>
      </div>

      {errors.title && <span className="field-error">{errors.title}</span>}
      {banner && (
        <p className="form-banner error" role="alert">
          {banner}
        </p>
      )}
      {notice && (
        <p className="form-banner ok" role="status">
          {notice}
        </p>
      )}

      <div className="editor-tabs" role="tablist" aria-label="Editor view">
        <button
          type="button"
          role="tab"
          className="editor-tab"
          aria-selected={tab === "write"}
          onClick={() => setTab("write")}
        >
          Write
        </button>
        <button
          type="button"
          role="tab"
          className="editor-tab"
          aria-selected={tab === "preview"}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>
      </div>

      {tab === "write" ? (
        <>
          <div className="editor-toolbar">
            <label className="btn editor-upload">
              {uploading ? "Uploading…" : "Insert image"}
              <input
                type="file"
                accept="image/*"
                className="visually-hidden"
                disabled={uploading || !uploadsEnabled}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, false);
                  e.target.value = "";
                }}
              />
            </label>
            {!uploadsEnabled && (
              <span className="editor-hint">
                Image storage off — paste image URLs instead.
              </span>
            )}
          </div>

          <textarea
            ref={bodyRef}
            className="editor-body"
            placeholder={
              "Write in Markdown.\n\n## A heading\n\nSome **bold** text."
            }
            value={post.body}
            onChange={(e) => set("body", e.target.value)}
            aria-label="Post body"
          />
        </>
      ) : (
        <div className="editor-preview">
          {previewLoading ? (
            <p className="empty-note">Rendering…</p>
          ) : preview ? (
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          ) : (
            <p className="empty-note">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <details className="editor-details">
        <summary>Post settings</summary>
        <div className="editor-fields">
          <div className="form-row">
            <label className="field-label" htmlFor="description">
              Summary <span className="field-optional">shown on the index</span>
            </label>
            <textarea
              id="description"
              className="field-textarea editor-summary"
              rows={2}
              value={post.description}
              onChange={(e) => set("description", e.target.value)}
            />
            {errors.description && (
              <span className="field-error">{errors.description}</span>
            )}
          </div>

          <div className="form-two">
            <div className="form-row">
              <label className="field-label" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className="field-select"
                value={post.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabels[c]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label className="field-label" htmlFor="slug">
                Web address
              </label>
              <input
                id="slug"
                className="field-input"
                value={post.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  set("slug", e.target.value);
                }}
                onBlur={(e) => set("slug", slugify(e.target.value))}
              />
              {errors.slug && (
                <span className="field-error">{errors.slug}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <span className="field-label">Cover image</span>
            {post.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="editor-cover"
                src={post.coverUrl}
                alt={post.coverAlt || "Cover preview"}
              />
            )}
            <div className="editor-cover-row">
              <label className="btn editor-upload">
                {post.coverUrl ? "Replace" : "Upload cover"}
                <input
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  disabled={uploading || !uploadsEnabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, true);
                    e.target.value = "";
                  }}
                />
              </label>
              {post.coverUrl && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => set("coverUrl", "")}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              className="field-input"
              placeholder="…or paste an image URL"
              value={post.coverUrl}
              onChange={(e) => set("coverUrl", e.target.value)}
              aria-label="Cover image URL"
            />
            {errors.coverUrl && (
              <span className="field-error">{errors.coverUrl}</span>
            )}
            <input
              className="field-input"
              placeholder="Describe the image (for screen readers)"
              value={post.coverAlt}
              onChange={(e) => set("coverAlt", e.target.value)}
              aria-label="Cover image description"
            />
          </div>

          <label className="editor-check">
            <input
              type="checkbox"
              checked={post.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            Feature this post at the top of /writing
          </label>
        </div>
      </details>

      <div className="editor-actions">
        <button
          type="button"
          className="btn"
          onClick={() => save("draft")}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          className="btn btn-solid"
          onClick={() => save("published")}
          disabled={saving}
        >
          {post.status === "published" ? "Update live post" : "Publish"}
        </button>
        {post.id !== null && (
          <button
            type="button"
            className="btn editor-delete"
            onClick={remove}
            disabled={saving}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
