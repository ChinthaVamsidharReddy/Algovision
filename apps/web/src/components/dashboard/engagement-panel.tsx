"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { localDay, readDays } from "@/lib/activity-log";
import { computeEngagement, type PathSteps } from "@/lib/engagement";
import type { CategoryIds } from "@/lib/progress";
import { solvedMarks } from "@/lib/practice/storage";
import { useLearning } from "../learning/learning-provider";

/** Level, streak, badges and certificates, all derived from progress (see lib/engagement.ts). */
export function EngagementPanel({ groups, paths }: { groups: readonly CategoryIds[]; paths: readonly PathSteps[] }) {
  const learning = useLearning();
  const [local, setLocal] = useState<{ days: string[]; solved: { id: string; date: string | null }[]; today: string } | null>(null);
  const allIds = useMemo(() => groups.flatMap((g) => g.ids), [groups]);
  useEffect(() => setLocal({ days: readDays(), solved: solvedMarks(allIds), today: localDay(new Date()) }), [allIds]);

  const e = useMemo(
    () => computeEngagement({ progress: [...learning.progress.values()], solved: local?.solved ?? [], activityDays: local?.days ?? [], groups, paths, today: local?.today ?? localDay(new Date()) }),
    [learning.progress, local, groups, paths],
  );
  const earned = e.badges.filter((b) => b.earned);
  const locked = e.badges.filter((b) => !b.earned);
  const pct = Math.round((e.level.into / e.level.need) * 100);
  const finished = paths.filter((p) => e.completedPaths.includes(p.id));

  return (
    <section aria-labelledby="engagement" className="space-y-5" data-testid="engagement">
      <h2 id="engagement" className="text-xl font-bold">
        Level, streak and badges
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Level</p>
          <p className="text-3xl font-bold" data-testid="level">
            Level {e.level.level}
          </p>
          <div role="progressbar" aria-label="Progress to the next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${e.level.into} of ${e.level.need} XP`} className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-muted" data-testid="xp">
            {e.xp} XP in total &middot; {e.level.into} of {e.level.need} to level {e.level.level + 1}
          </p>
          <p className="text-xs text-muted">
            XP: 5 for opening an algorithm, 20 for completing it, 30 for solving its practice problem, 100 for finishing a path.
          </p>
        </div>
        <div className="space-y-2 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Streak</p>
          <p className="text-3xl font-bold" data-testid="streak">
            {e.streak.current} {e.streak.current === 1 ? "day" : "days"}
          </p>
          <p className="text-sm text-muted">Longest streak: {e.streak.longest} {e.streak.longest === 1 ? "day" : "days"}</p>
          <p className="text-sm text-muted">
            {e.streak.activeToday ? "You have learned today. Come back tomorrow to keep it going." : e.streak.current > 0 ? "Learn something today to keep your streak alive." : "Open an algorithm today to start a streak."}
          </p>
        </div>
      </div>

      {finished.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-5">
          <h3 className="font-bold">Certificates</h3>
          <ul className="space-y-1">
            {finished.map((p) => (
              <li key={p.id}>
                <Link href={`/paths/${p.id}/certificate`} className="font-medium text-accent underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold">
          Badges earned <span className="font-normal text-muted">({earned.length} of {e.badges.length})</span>
        </h3>
        {earned.length === 0 ? (
          <p className="text-muted">No badges yet. Complete an algorithm to earn your first one.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="badges-earned">
            {earned.map((b) => (
              <li key={b.id} className="rounded-xl border border-success bg-surface p-3">
                <p className="font-semibold">
                  <span aria-hidden="true" className="text-success">✓ </span>
                  {b.title}
                </p>
                <p className="text-sm text-muted">{b.description}</p>
              </li>
            ))}
          </ul>
        )}
        <details className="rounded-xl border border-border bg-surface p-3">
          <summary className="min-h-11 cursor-pointer py-2 font-medium">Badges still to earn ({locked.length})</summary>
          <ul className="mt-2 space-y-2">
            {locked.map((b) => (
              <li key={b.id} className="text-sm">
                <span className="font-semibold">{b.title}</span> <span className="text-muted">&middot; {b.value} of {b.target}</span>
                <span className="block text-muted">{b.description}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
