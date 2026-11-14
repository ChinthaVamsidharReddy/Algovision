"use client";

import Link from "next/link";
import type { AlgorithmExtrasData } from "@/lib/learning-data";
import { useLearning } from "./learning-provider";

/** Prerequisites, the paths an algorithm belongs to, practice problems and a compare link, under the workspace. */
export function AlgorithmExtras({ id, extras }: { id: string; extras: AlgorithmExtrasData }) {
  const learning = useLearning();
  const done = (slug: string) => learning.progress.get(slug)?.status === "COMPLETED";
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      {extras.prerequisites.length > 0 && (
        <section aria-labelledby="prereq-title" className="rounded-xl border border-border bg-surface p-5">
          <h2 id="prereq-title" className="mb-2 text-lg font-semibold">Learn this first</h2>
          <ul className="space-y-1">
            {extras.prerequisites.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span aria-hidden="true" className={done(p.id) ? "text-success" : "text-muted"}>{done(p.id) ? "✓" : "○"}</span>
                <Link href={`/algorithms/${p.id}`} className="font-medium text-accent underline">{p.title}</Link>
                {done(p.id) && <span className="text-sm text-muted">completed</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {extras.paths.length > 0 && (
        <section aria-labelledby="paths-title" className="rounded-xl border border-border bg-surface p-5">
          <h2 id="paths-title" className="mb-2 text-lg font-semibold">On these learning paths</h2>
          <ul className="flex flex-wrap gap-2">
            {extras.paths.map((p) => (
              <li key={p.id}>
                <Link href={`/paths/${p.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-2">{p.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {extras.practice.length > 0 && (
        <section aria-labelledby="practice-title" className="rounded-xl border border-border bg-surface p-5">
          <h2 id="practice-title" className="mb-2 text-lg font-semibold">Practice this idea</h2>
          <ul className="space-y-1">
            {extras.practice.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">
                  {l.title}<span className="sr-only"> (opens {l.source} in a new tab)</span>
                </a>
                <span className="text-sm text-muted"> on {l.source}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="practice-title" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="practice-title" className="mb-2 text-lg font-semibold">Practice</h2>
        <p className="mb-2 text-muted">Write it yourself and run it against test cases, right in your browser.</p>
        <Link href={`/practice/${id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-2">Practice in JavaScript or Python</Link>
      </section>
      <section aria-labelledby="compare-title" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="compare-title" className="mb-2 text-lg font-semibold">Compare</h2>
        <p className="mb-2 text-muted">See how this algorithm stacks up against another one.</p>
        <Link href={`/compare?a=${id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-2">Compare with another algorithm</Link>
      </section>
    </div>
  );
}
