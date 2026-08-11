"use client";

import { useEffect, useState } from "react";

/**
 * Registers a view and shows the running count. Fully optional: when the
 * database is not configured the API returns no count and this renders nothing,
 * so the post page degrades cleanly with no error surface.
 */
export function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/views/${slug}`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (active && data && typeof data.count === "number") {
          setViews(data.count);
        }
      })
      .catch(() => {
        /* views are non-critical — ignore network/DB failures */
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (views === null) return null;
  return (
    <span>
      {views.toLocaleString("en-GB")} view{views === 1 ? "" : "s"}
    </span>
  );
}
