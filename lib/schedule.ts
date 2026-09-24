/**
 * Publishing cadence maths, shared by the studio's queue panel and the API
 * that writes the dates. Pure functions with no database or DOM access so the
 * same rules apply on the client preview and the server write.
 */

/** Default gap between posts, in days. */
export const DEFAULT_CADENCE_DAYS = 2;

/** Hour (UTC) the queue lands on. 06:00 UTC is 09:00 in Nairobi. */
export const PUBLISH_HOUR_UTC = 6;

export const MIN_CADENCE_DAYS = 1;
export const MAX_CADENCE_DAYS = 30;

const DAY_MS = 86_400_000;

/**
 * Snap a date to the publishing hour. Queued posts should go out at a
 * predictable time of day rather than whenever the row happened to be written.
 */
export function atPublishHour(date: Date): Date {
  const snapped = new Date(date);
  snapped.setUTCHours(PUBLISH_HOUR_UTC, 0, 0, 0);
  return snapped;
}

/**
 * The dates for `count` posts, starting at `start` and spaced `cadenceDays`
 * apart. A start date earlier than now is pulled forward to today so that
 * queueing never back-dates a post into the "publish immediately" window by
 * accident.
 */
export function cadenceDates(
  count: number,
  start: Date,
  cadenceDays = DEFAULT_CADENCE_DAYS,
  now = new Date(),
): Date[] {
  const gap = clampCadence(cadenceDays);
  const first = atPublishHour(start < now ? now : start);

  return Array.from(
    { length: Math.max(0, count) },
    (_, i) => new Date(first.getTime() + i * gap * DAY_MS),
  );
}

export function clampCadence(days: number): number {
  if (!Number.isFinite(days)) return DEFAULT_CADENCE_DAYS;
  return Math.min(
    MAX_CADENCE_DAYS,
    Math.max(MIN_CADENCE_DAYS, Math.round(days)),
  );
}

/** `yyyy-mm-dd` for a date input, in UTC so it matches what gets stored. */
export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse a `yyyy-mm-dd` date input back to the publishing hour on that day. */
export function fromDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : atPublishHour(date);
}

const queueFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "Tue 14 Oct" — how a queued date reads in the studio list. */
export function formatQueued(date: Date | string): string {
  return queueFmt.format(typeof date === "string" ? new Date(date) : date);
}
