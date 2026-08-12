"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const res = await fetch("/api/studio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };

      if (res.ok && json.ok) {
        const next = params.get("next");
        router.replace(next?.startsWith("/studio") ? next : "/studio");
        router.refresh();
      } else {
        setError(json.message ?? "Couldn’t sign you in.");
        setPending(false);
      }
    } catch {
      setError("Couldn’t reach the server. Check your connection.");
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field-input"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "password-error" : undefined}
        />
        {error && (
          <span id="password-error" className="field-error" role="alert">
            {error}
          </span>
        )}
      </div>

      <button className="btn btn-solid" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
