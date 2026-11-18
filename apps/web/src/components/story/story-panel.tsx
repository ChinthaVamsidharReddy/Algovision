"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExecutionStep } from "@algovision/trace-schema";
import type { Story, StoryFrame } from "@/lib/stories";
import type { ArrayTrace, Tone } from "@/lib/stories/types";

const PITCH = 72; // px between cell centres
const CELL = 64;
const KEY = "av-story";
const SCENE_H = 76 + CELL; // actors row + cells row
const MIN_SCALE = 0.5;

const TONE: Record<Tone, { fill: string; stroke: string; text: string; strike?: boolean }> = {
  plain: { fill: "var(--surface-2)", stroke: "var(--border)", text: "var(--text)" },
  dim: { fill: "var(--surface)", stroke: "var(--border)", text: "var(--muted)", strike: true },
  hit: { fill: "var(--role-active-fill)", stroke: "var(--role-active-stroke)", text: "var(--text)" },
  warn: { fill: "var(--role-swapped-fill)", stroke: "var(--role-swapped-stroke)", text: "var(--text)" },
  good: { fill: "var(--role-found-fill)", stroke: "var(--role-found-stroke)", text: "var(--text)" },
};

/** Where each actor stands: actors on the same cell share it side by side instead of covering each other. */
function actorX(frame: StoryFrame, index: number): number {
  const a = frame.actors[index]!;
  const mates = frame.actors.filter((x) => x.at === a.at);
  const slot = mates.indexOf(a);
  const shift = mates.length === 1 ? 0 : (slot - (mates.length - 1) / 2) * 44;
  return a.at * PITCH + CELL / 2 + shift;
}

/**
 * The story retelling of the current step: the situation, the cast, a scene that follows the algorithm step by step,
 * and the narration in the story's own words. Shown above the standard visualization, which stays as it was.
 */
export function StoryPanel({ story, step, trace }: { story: Story; step: ExecutionStep<"array">; trace: ArrayTrace }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "hidden") setOpen(false);
    } catch {
      /* storage blocked: the story just stays shown */
    }
  }, []);
  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(KEY, o ? "hidden" : "shown");
      } catch {
        /* ignore */
      }
      return !o;
    });
  };

  // Shrink the scene to fit a narrow screen (down to MIN_SCALE) so both characters stay in view; wider scenes scroll.
  const box = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setAvail(el.clientWidth);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const frame = useMemo(() => story.frame(step, trace), [story, step, trace]);
  const finished = step.index === trace.steps.length - 1;
  const width = Math.max(frame.cells.length, 1) * PITCH;
  const scale = avail > 0 ? Math.min(1, Math.max(MIN_SCALE, (avail - 24) / width)) : 1;

  return (
    <section aria-labelledby="story-title" className="space-y-3 rounded-xl border border-border bg-surface p-4" data-testid="story">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="story-title" className="text-lg font-bold">
          <span aria-hidden="true">{story.emoji} </span>
          {story.title}
        </h2>
        <button type="button" onClick={toggle} aria-expanded={open} aria-controls="story-body" className="min-h-11 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-2">
          {open ? "Hide the story" : "Show the story"}
        </button>
      </div>

      <div id="story-body" hidden={!open} className="space-y-4">
        <div
          className="overflow-x-auto rounded-lg border border-border bg-bg p-3"
          data-testid="story-scroll"
          ref={box}
          data-scale={scale.toFixed(2)}
          tabIndex={0}
          role="region"
          aria-label="Story scene, scrolls sideways when wide"
        >
          <div style={{ width: width * scale, height: SCENE_H * scale }} className="mx-auto">
            <div aria-hidden="true" className="relative" style={{ width, height: SCENE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <div className="relative" style={{ height: 76 }}>
                {frame.actors.map((a, i) => (
                  <div
                    key={a.id}
                    data-testid={`actor-${a.id}`}
                    data-at={a.at}
                    className="absolute bottom-0 text-center motion-safe:transition-[left] motion-safe:duration-500"
                    style={{ left: actorX(frame, i), width: 56, transform: "translateX(-50%)" }}
                  >
                    <div className="text-3xl leading-none">{a.emoji}</div>
                    <div className="mt-0.5 text-xs font-semibold">{a.name}</div>
                  </div>
                ))}
              </div>
              <div className="flex" style={{ gap: PITCH - CELL }}>
                {frame.cells.map((c, i) => {
                  const t = TONE[c.tone];
                  return (
                    <div
                      key={i}
                      data-testid="story-cell"
                      data-tone={c.tone}
                      className="flex flex-col items-center justify-center rounded-lg"
                      style={{ width: CELL, height: CELL, background: t.fill, border: `2px solid ${t.stroke}`, color: t.text, borderStyle: c.tone === "dim" ? "dashed" : "solid" }}
                    >
                      <span className={`text-lg font-bold ${t.strike ? "line-through" : ""}`}>{c.main}</span>
                      {c.sub && (
                        <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                          {c.sub}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {frame.meter && <Meter {...frame.meter} />}

        <div className="space-y-2 rounded-lg bg-surface-2 p-4">
          <p aria-live="polite" aria-atomic="true" className="text-lg leading-relaxed" data-testid="story-says">
            {frame.says}
          </p>
          {frame.inCode && (
            <p className="text-sm text-muted">
              In the code: <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-fg">{frame.inCode}</code>
            </p>
          )}
          {frame.banner && (
            <p role="status" data-testid="story-banner" className={`font-semibold ${frame.banner.kind === "good" ? "text-success" : frame.banner.kind === "bad" ? "text-danger" : ""}`}>
              {frame.banner.kind === "good" ? "✓ " : frame.banner.kind === "bad" ? "✗ " : ""}
              {frame.banner.text}
            </p>
          )}
        </div>

        <details open className="rounded-lg border border-border p-4" data-testid="story-intro">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold">The situation and who is who</summary>
          <div className="space-y-3 pt-1">
            <p className="max-w-3xl leading-relaxed" data-testid="story-hook">
              <strong>The situation. </strong>
              {story.hook}
            </p>
            <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2" aria-label="Who is who">
              {story.cast.map((c) => (
                <li key={c.name} className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="text-lg">
                    {c.emoji}
                  </span>
                  <span>
                    <strong>{c.name}</strong> <span className="text-muted">= {c.means}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>

        {finished && (
          <p className="rounded-lg border border-border p-4" data-testid="story-moral">
            <strong>Remember it like this. </strong>
            {story.moral}
          </p>
        )}
      </div>
    </section>
  );
}

function Meter({ label, value, target, verdict }: { label: string; value: number; target: number; verdict: "low" | "high" | "match" }) {
  const text = verdict === "match" ? "exactly on budget" : verdict === "low" ? "under budget: spend more" : "over budget: spend less";
  const barable = value >= 0 && target > 0;
  const max = Math.max(value, target) * 1.15 || 1;
  return (
    <div className="space-y-1" data-testid="story-meter" data-verdict={verdict}>
      <p className="text-sm">
        <strong>Budget {target}</strong> &middot; {label} &middot;{" "}
        <span className={verdict === "match" ? "font-semibold text-success" : verdict === "high" ? "font-semibold text-danger" : "font-semibold"}>{text}</span>
      </p>
      {barable && (
        <div aria-hidden="true" className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${(value / max) * 100}%`, background: verdict === "match" ? "var(--role-found-stroke)" : verdict === "high" ? "var(--role-swapped-stroke)" : "var(--role-active-stroke)" }}
          />
          <div className="absolute inset-y-0 w-0.5 bg-fg" style={{ left: `${(target / max) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
