"use client";

import { useEffect, useRef } from "react";

/**
 * The signature element: a five-node request path where an amber pulse travels
 * each connector in sequence, every node latches to its lit state as the pulse
 * arrives, and the monospace readout resolves to `200 OK · <n>ms`.
 *
 * Behaviour is ported 1:1 from the reference implementation:
 *  - horizontal on desktop, vertical below 760px (CSS-driven)
 *  - animates only while on screen (IntersectionObserver), timers cleaned up
 *  - under prefers-reduced-motion, all nodes render lit with no motion
 */
const NODES = [
  { label: "External portal", meta: "REACT / TS" },
  { label: "API gateway", meta: "ASP.NET CORE" },
  { label: "Token exchange", meta: "OAUTH 2.0 / OIDC" },
  { label: "Business Central", meta: "ODATA V4 / AL" },
  { label: "Response", meta: "200 OK" },
] as const;

const STEP = 1150; // ms between each node latching
const TAIL = 2200; // ms pause before the cycle loops

export function RequestTrace() {
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const flow = flowRef.current;
    const root = rootRef.current;
    const codeEl = codeRef.current;
    if (!flow || !root) return;

    const nodes = Array.from(flow.querySelectorAll<HTMLElement>(".node"));

    // Reduced motion: freeze every node in its final lit state, no animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((n) => n.classList.add("on"));
      return;
    }

    let timers: ReturnType<typeof setTimeout>[] = [];
    const clear = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };

    const run = () => {
      clear();
      nodes.forEach((n) => n.classList.remove("on", "fire"));
      if (codeEl) {
        codeEl.textContent = "… awaiting response";
        codeEl.style.color = "var(--steel)";
      }

      nodes.forEach((node, i) => {
        timers.push(
          setTimeout(() => {
            node.classList.add("on");
            if (i < nodes.length - 1) node.classList.add("fire");
            if (i === nodes.length - 1 && codeEl) {
              const ms = 380 + Math.floor(Math.random() * 90);
              codeEl.textContent = `200 OK · ${ms}ms`;
              codeEl.style.color = "var(--ok)";
            }
          }, i * STEP),
        );
      });

      timers.push(setTimeout(run, nodes.length * STEP + TAIL));
    };

    // Only animate while the trace is on screen.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? run() : clear()));
      },
      { threshold: 0.25 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      clear();
    };
  }, []);

  return (
    <div className="trace" id="trace" ref={rootRef}>
      <div className="trace-head">
        <div className="trace-title">
          TRACE — <b>supplier portal → business central</b>
        </div>
        <div className="trace-code" ref={codeRef}>
          200 OK · 412ms
        </div>
      </div>
      <div className="flow" ref={flowRef}>
        {NODES.map((node, i) => (
          <div className="node" key={node.label}>
            {i < NODES.length - 1 && (
              <div className="wire" aria-hidden="true" />
            )}
            <div className="node-mark" aria-hidden="true" />
            <div className="node-label">{node.label}</div>
            <div className="node-meta">{node.meta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
