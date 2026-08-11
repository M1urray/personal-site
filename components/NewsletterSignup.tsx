"use client";

import { useRef, useState, type FormEvent } from "react";
import { subscribeSchema } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

export function NewsletterSignup({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const mountedAt = useRef(Date.now());

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");

    const parsed = subscribeSchema.safeParse({ email });
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Please enter a valid email.",
      );
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          website: String(fd.get("website") ?? ""),
          elapsed: Date.now() - mountedAt.current,
          source: "site",
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };

      if (res.ok && json.ok) {
        setStatus("success");
        setMessage(json.message ?? "Almost there — check your inbox.");
        form.reset();
      } else {
        setStatus("error");
        setError(json.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setError("Couldn’t reach the server. Please try again.");
    }
  }

  if (!enabled) return null;

  return (
    <div className="subscribe">
      <div className="subscribe-copy">
        <h3>Get the notes</h3>
        <p>
          New posts on Business Central integration, sent only when there’s
          something worth reading. Double opt-in, unsubscribe in one click.
        </p>
      </div>

      {status === "success" ? (
        <p className="form-success" role="status">
          {message}
        </p>
      ) : (
        <form className="subscribe-form" onSubmit={onSubmit} noValidate>
          <input
            type="text"
            name="website"
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <label className="visually-hidden" htmlFor="sub-email">
            Email address
          </label>
          <input
            id="sub-email"
            name="email"
            type="email"
            className="field-input"
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={status === "error"}
            aria-describedby={error ? "sub-error" : undefined}
          />
          <button
            className="btn btn-solid"
            type="submit"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}

      {status === "error" && error && (
        <p id="sub-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
