"use client";

import Link from "next/link";
import { useMemo } from "react";
import { computeEngagement } from "@/lib/engagement";
import { localDay } from "@/lib/activity-log";
import type { PathData } from "@/lib/learning-data";
import { RequireAuth } from "../auth/require-auth";
import { useAuth } from "../auth/auth-provider";
import { useLearning } from "../learning/learning-provider";
import { ProgressBar } from "../learning/progress-bar";
import { PrintButton } from "../print-button";

export function Certificate({ path }: { path: PathData }) {
  return (
    <RequireAuth returnTo={`/paths/${path.id}/certificate`} what="your certificate">
      <Inner path={path} />
    </RequireAuth>
  );
}

function Inner({ path }: { path: PathData }) {
  const auth = useAuth();
  const learning = useLearning();
  const steps = useMemo(() => path.steps.map((s) => s.id), [path]);
  const e = useMemo(
    () => computeEngagement({ progress: [...learning.progress.values()], solved: [], activityDays: [], groups: [{ id: path.id, name: path.title, ids: steps }], paths: [{ id: path.id, title: path.title, steps }], today: localDay(new Date()) }),
    [learning.progress, path, steps],
  );
  const name = auth.status === "authenticated" ? auth.user.fullName : "";
  const done = e.completedPaths.includes(path.id);

  if (learning.status === "idle" || learning.status === "loading") {
    return (
      <div role="status" aria-live="polite" className="h-40 animate-pulse rounded-xl bg-surface-2">
        <span className="sr-only">Loading your progress…</span>
      </div>
    );
  }
  if (learning.status === "error") {
    return (
      <div role="alert" className="mx-auto max-w-md space-y-3 rounded-xl border border-danger bg-surface p-6 text-center">
        <p className="font-semibold text-danger">Could not load your progress</p>
        <p>{learning.error}</p>
      </div>
    );
  }
  if (!done) {
    const count = steps.filter((s) => learning.progress.get(s)?.status === "COMPLETED").length;
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-surface p-6" data-testid="certificate-locked">
        <h1 className="text-2xl font-bold">Certificate not earned yet</h1>
        <p className="text-muted">Complete every algorithm of &ldquo;{path.title}&rdquo; to earn this certificate.</p>
        <ProgressBar label="Path progress" done={count} total={steps.length} percent={Math.round((count / steps.length) * 100)} />
        <Link href={`/paths/${path.id}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg">
          Back to the path
        </Link>
      </div>
    );
  }
  const day = e.pathFinishedOn.get(path.id)!;
  const date = new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/paths/${path.id}`} className="font-medium text-accent underline">
          Back to the path
        </Link>
        <PrintButton />
      </div>
      <article aria-labelledby="cert-title" data-testid="certificate" className="space-y-4 rounded-xl border-4 border-double border-border bg-surface p-8 text-center print:border-black print:bg-white print:text-black">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted print:text-black">AlgoMigo</p>
        <h1 id="cert-title" className="text-3xl font-bold">
          Certificate of completion
        </h1>
        <p>This certifies that</p>
        <p className="text-2xl font-bold" data-testid="certificate-name">
          {name}
        </p>
        <p>has completed the learning path</p>
        <p className="text-2xl font-bold">{path.title}</p>
        <p className="text-muted print:text-black">
          {steps.length} algorithms, each with its step-by-step visualization and code in Java, Python, C++ and C.
        </p>
        <ul className="mx-auto max-w-md list-disc space-y-1 pl-6 text-left text-sm">
          {path.outcomes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <p data-testid="certificate-date">Completed on {date}</p>
        <p className="text-xs text-muted print:text-black">This is a record of study on AlgoMigo. It is not an accredited qualification.</p>
      </article>
    </div>
  );
}
