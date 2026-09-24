import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import {
  DEFAULT_CADENCE_DAYS,
  MAX_CADENCE_DAYS,
  MIN_CADENCE_DAYS,
  cadenceDates,
  fromDateInput,
} from "@/lib/schedule";
import { fieldErrorsFromZod } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Bulk queueing for the studio. Spacing 31 drafts by hand is the kind of
 * chore that gets abandoned halfway, so the whole run is dated in one call —
 * and cleared in one call when the plan changes.
 */

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("queue"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date."),
    cadenceDays: z.coerce
      .number()
      .int()
      .min(MIN_CADENCE_DAYS, "At least one day between posts.")
      .max(MAX_CADENCE_DAYS, "At most 30 days between posts.")
      .default(DEFAULT_CADENCE_DAYS),
    /** Omit to queue every unscheduled draft, oldest first. */
    ids: z.array(z.number().int()).optional(),
  }),
  z.object({ action: z.literal("clear") }),
]);

function noDb() {
  return NextResponse.json(
    { ok: false, message: "The database isn’t connected." },
    { status: 503 },
  );
}

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return noDb();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Couldn’t read that request." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Check the schedule settings.",
        fieldErrors: fieldErrorsFromZod(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "clear") {
      const cleared = await db
        .update(posts)
        .set({ scheduledFor: null })
        .where(and(eq(posts.status, "draft"), isNotNull(posts.scheduledFor)))
        .returning({ id: posts.id });

      return NextResponse.json({ ok: true, cleared: cleared.length });
    }

    const { startDate, cadenceDays, ids } = parsed.data;
    const start = fromDateInput(startDate);
    if (!start) {
      return NextResponse.json(
        {
          ok: false,
          message: "That start date isn’t valid.",
          fieldErrors: { startDate: "Pick a start date." },
        },
        { status: 400 },
      );
    }

    // Only ever queue drafts. A published post can't be "re-published", and an
    // explicit id list is filtered the same way rather than trusted.
    const selection = ids?.length
      ? and(eq(posts.status, "draft"), inArray(posts.id, ids))
      : and(eq(posts.status, "draft"), isNull(posts.scheduledFor));

    const drafts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(selection)
      // Seed order is the running order in docs/content-plan.md.
      .orderBy(asc(posts.id));

    if (drafts.length === 0) {
      return NextResponse.json({ ok: true, queued: 0, dates: [] });
    }

    const dates = cadenceDates(drafts.length, start, cadenceDays);

    for (const [i, draft] of drafts.entries()) {
      await db
        .update(posts)
        .set({ scheduledFor: dates[i]! })
        .where(and(eq(posts.id, draft.id), eq(posts.status, "draft")));
    }

    return NextResponse.json({
      ok: true,
      queued: drafts.length,
      first: dates[0]!.toISOString(),
      last: dates[dates.length - 1]!.toISOString(),
    });
  } catch (err) {
    console.error("[studio] schedule failed:", err);
    return NextResponse.json(
      { ok: false, message: "Couldn’t update the schedule." },
      { status: 500 },
    );
  }
}
