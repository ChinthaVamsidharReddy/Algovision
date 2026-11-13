"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PATHS, nextStep } from "@algovision/algorithms";
import type { PathData } from "@/lib/learning-data";
import { ProgressBar } from "../learning/progress-bar";
import { useLearning } from "../learning/learning-provider";

export function PathView({ path }: { path: PathData }) {
  const learning = useLearning();
  const status = (id: string) => learning.progress.get(id)?.status;
  const done = useMemo(() => new Set(path.steps.filter((s) => learning.progress.get(s.id)?.status === "COMPLETED").map((s) => s.id)), [path, learning.progress]);
  const source = PATHS.find((p) => p.id === path.id)!;
  const next = nextStep(source, done);
  const nextTitle = path.steps.find((s) => s.id === next)?.title;
  const percent = Math.round((done.size / path.steps.length) * 100);
  const signedIn = learning.status !== "idle";

  return (
    <div className="space-y-6">
      <ProgressBar label="Path progress" done={done.size} total={path.steps.length} percent={percent} />

      <div className="rounded-xl border border-border bg-surface p-5">
        {next ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              <span className="font-semibold">{done.size === 0 ? "Start with" : "Up next:"}</span> {nextTitle}
            </p>
            <Link href={`/algorithms/${next}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg">
              {done.size === 0 ? "Start this path" : "Continue"}
            </Link>
          </div>
        ) : (
          <p className="font-semibold text-success">You have completed every algorithm on this path.</p>
        )}
        {!signedIn && (
          <p className="mt-3 text-sm text-muted">
            <Link href={`/login?next=${encodeURIComponent(`/paths/${path.id}`)}`} className="font-medium text-accent underline">Sign in</Link> to track which steps you have finished.
          </p>
        )}
      </div>

      <section aria-labelledby="outcomes" className="space-y-2">
        <h2 id="outcomes" className="text-lg font-semibold">What you will be able to do</h2>
        <ul className="list-disc space-y-1 pl-6 text-muted">
          {path.outcomes.map((o) => <li key={o}>{o}</li>)}
        </ul>
      </section>

      <section aria-labelledby="steps" className="space-y-3">
        <h2 id="steps" className="text-lg font-semibold">Steps</h2>
        <ol className="space-y-2">
          {path.steps.map((s, i) => {
            const st = status(s.id);
            const locked = s.prerequisites.filter((p) => path.steps.some((x) => x.id === p.id) && !done.has(p.id));
            return (
              <li key={s.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-surface p-4 ${s.id === next ? "border-accent" : "border-border"}`}>
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold">
                  {st === "COMPLETED" ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/algorithms/${s.id}`} className="font-semibold hover:underline">{s.title}</Link>
                  <p className="text-sm text-muted">
                    {s.difficulty} &middot; Time {s.time}
                    {st === "COMPLETED" && " · Completed"}
                    {st === "IN_PROGRESS" && " · In progress"}
                  </p>
                  {locked.length > 0 && st !== "COMPLETED" && (
                    <p className="text-sm text-muted">
                      Best after: {locked.map((p, k) => (
                        <span key={p.id}>{k > 0 && ", "}<Link href={`/algorithms/${p.id}`} className="underline">{p.title}</Link></span>
                      ))}
                    </p>
                  )}
                </div>
                {s.id === next && <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold">Up next</span>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
