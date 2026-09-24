"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_CADENCE_DAYS,
  formatQueued,
  toDateInput,
} from "@/lib/schedule";

type Props = {
  /** Drafts with no date on them — what "Queue the rest" would pick up. */
  unscheduled: number;
  /** Drafts already queued. */
  scheduled: number;
  nextUp: Date | null;
};

type Result = {
  ok?: boolean;
  message?: string;
  queued?: number;
  cleared?: number;
  first?: string;
  last?: string;
};

export function QueuePanel({ unscheduled, scheduled, nextUp }: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() =>
    toDateInput(new Date(Date.now() + 86_400_000)),
  );
  const [cadence, setCadence] = useState(String(DEFAULT_CADENCE_DAYS));
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState("");
  const [notice, setNotice] = useState("");

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setBanner("");
    setNotice("");
    try {
      const res = await fetch("/api/studio/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as Result;

      if (res.ok && json.ok) {
        if (json.cleared !== undefined) {
          setNotice(
            json.cleared === 0
              ? "Nothing was queued."
              : `Cleared ${json.cleared} from the queue.`,
          );
        } else if (json.queued === 0) {
          setNotice("No unscheduled drafts to queue.");
        } else {
          setNotice(
            `Queued ${json.queued} — first ${formatQueued(json.first!)}, ` +
              `last ${formatQueued(json.last!)}.`,
          );
        }
        router.refresh();
      } else {
        setBanner(json.message ?? "Couldn’t update the schedule.");
      }
    } catch {
      setBanner("Couldn’t reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="queue-panel" aria-labelledby="queue-heading">
      <div className="queue-head">
        <h2 className="queue-title" id="queue-heading">
          Publishing queue
        </h2>
        <p className="queue-summary">
          {scheduled > 0 ? (
            <>
              <strong>{scheduled}</strong> queued
              {nextUp && <> · next {formatQueued(nextUp)}</>}
              {unscheduled > 0 && <> · {unscheduled} not queued</>}
            </>
          ) : (
            <>
              Nothing queued. {unscheduled} draft
              {unscheduled === 1 ? "" : "s"} waiting.
            </>
          )}
        </p>
      </div>

      <p className="queue-note">
        One post goes live per slot and appears in the feed Zapier watches.
        Queue only what you’ve read — this publishes without asking again.
      </p>

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

      <div className="queue-fields">
        <div className="form-row">
          <label className="field-label" htmlFor="queue-start">
            Start
          </label>
          <input
            id="queue-start"
            type="date"
            className="field-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label className="field-label" htmlFor="queue-cadence">
            Every <span className="field-optional">days</span>
          </label>
          <input
            id="queue-cadence"
            type="number"
            min={1}
            max={30}
            className="field-input"
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
          />
        </div>
      </div>

      <div className="queue-actions">
        <button
          type="button"
          className="btn btn-solid"
          disabled={busy || unscheduled === 0}
          onClick={() =>
            send({
              action: "queue",
              startDate,
              cadenceDays: Number(cadence) || DEFAULT_CADENCE_DAYS,
            })
          }
        >
          {busy
            ? "Working…"
            : `Queue ${unscheduled} draft${unscheduled === 1 ? "" : "s"}`}
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy || scheduled === 0}
          onClick={() => {
            if (!confirm("Clear every queued date? Drafts stay as drafts.")) {
              return;
            }
            send({ action: "clear" });
          }}
        >
          Clear queue
        </button>
      </div>
    </section>
  );
}
