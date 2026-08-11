"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  PROJECT_TYPES,
  contactSchema,
  fieldErrorsFromZod,
} from "@/lib/validation";
import { siteConfig } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [banner, setBanner] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mountedAt = useRef(Date.now());

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      setStatus("error");
      setBanner("Please fix the highlighted fields and try again.");
      return;
    }

    setStatus("submitting");
    setErrors({});
    setBanner("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          website: String(data.website ?? ""),
          elapsed: Date.now() - mountedAt.current,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        fieldErrors?: Record<string, string>;
      };

      if (res.ok && json.ok) {
        setStatus("success");
        setBanner(json.message ?? "Thanks — your message reached me.");
        form.reset();
      } else {
        setStatus("error");
        setBanner(json.message ?? "Something went wrong. Please try again.");
        if (json.fieldErrors) setErrors(json.fieldErrors);
      }
    } catch {
      setStatus("error");
      setBanner(
        "Couldn’t reach the server. Please check your connection and try again.",
      );
    }
  }

  if (!enabled) {
    return (
      <div className="form-fallback">
        <p>
          The contact form isn’t connected in this environment — email me
          directly and I’ll reply personally.
        </p>
        <a className="btn btn-solid" href={`mailto:${siteConfig.email}`}>
          Email {siteConfig.email}
        </a>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="form-success" role="status">
        {banner}
      </div>
    );
  }

  const describedBy = (field: string) =>
    errors[field] ? `${field}-error` : undefined;

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {/* honeypot — hidden from users, tempting to bots */}
      <input
        type="text"
        name="website"
        className="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="form-two">
        <div className="form-row">
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="field-input"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
          />
          {errors.name && (
            <span id="name-error" className="field-error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-row">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="field-input"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
          />
          {errors.email && (
            <span id="email-error" className="field-error">
              {errors.email}
            </span>
          )}
        </div>
      </div>

      <div className="form-two">
        <div className="form-row">
          <label className="field-label" htmlFor="company">
            Company <span className="field-optional">optional</span>
          </label>
          <input
            id="company"
            name="company"
            type="text"
            className="field-input"
            autoComplete="organization"
            aria-invalid={Boolean(errors.company)}
            aria-describedby={describedBy("company")}
          />
          {errors.company && (
            <span id="company-error" className="field-error">
              {errors.company}
            </span>
          )}
        </div>

        <div className="form-row">
          <label className="field-label" htmlFor="projectType">
            Project type
          </label>
          <select
            id="projectType"
            name="projectType"
            className="field-select"
            defaultValue=""
            aria-invalid={Boolean(errors.projectType)}
            aria-describedby={describedBy("projectType")}
          >
            <option value="" disabled>
              Select the closest…
            </option>
            {PROJECT_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.projectType && (
            <span id="projectType-error" className="field-error">
              {errors.projectType}
            </span>
          )}
        </div>
      </div>

      <div className="form-row">
        <label className="field-label" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          className="field-textarea"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message")}
        />
        {errors.message && (
          <span id="message-error" className="field-error">
            {errors.message}
          </span>
        )}
      </div>

      {status === "error" && banner && (
        <p className="form-banner error" role="alert">
          {banner}
        </p>
      )}

      <div className="form-actions">
        <button
          className="btn btn-solid"
          type="submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>
        <span className="form-hint">
          Or email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        </span>
      </div>
    </form>
  );
}
