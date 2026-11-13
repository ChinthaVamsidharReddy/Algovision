"use client";

import Link from "next/link";
import type { PathData } from "@/lib/learning-data";
import { ProgressBar } from "../learning/progress-bar";
import { useLearning } from "../learning/learning-provider";

const LEVEL_LABEL = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" } as const;

function useDone() {
  const learning = useLearning();
  return (id: string) => learning.progress.get(id)?.status === "COMPLETED";
}

export function PathList({ paths }: { paths: readonly PathData[] }) {
  const isDone = useDone();
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {paths.map((p) => {
        const done = p.steps.filter((s) => isDone(s.id)).length;
        const percent = Math.round((done / p.steps.length) * 100);
        return (
          <li key={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 hover:border-accent">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{LEVEL_LABEL[p.level]} &middot; {p.steps.length} algorithms</p>
            <h2 className="text-xl font-semibold">
              <Link href={`/paths/${p.id}`} className="hover:underline">{p.title}</Link>
            </h2>
            <p className="flex-1 text-muted">{p.summary}</p>
            <ProgressBar label="Path progress" done={done} total={p.steps.length} percent={percent} />
          </li>
        );
      })}
    </ul>
  );
}
