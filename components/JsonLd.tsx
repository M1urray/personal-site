/**
 * Renders a JSON-LD structured-data block. Data is serialised server-side and
 * injected as a script tag — no client JS, no hydration cost.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe structured data, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
