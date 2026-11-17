import type { CategoryIds } from "./progress";
import type { ProgressEntry } from "./learning-client";
import { localDay } from "./activity-log";

/**
 * XP, level, streak and badges. Everything is DERIVED from facts that already exist (server progress, solved
 * practice marks, the local activity days), never stored as a counter, so it cannot drift, double count or be
 * lost, and it stays right if progress is re-synced. This module is pure: `today` is passed in.
 */

export const XP = { started: 5, completed: 20, solved: 30, path: 100 } as const;

export interface PathSteps {
  readonly id: string;
  readonly title: string;
  readonly steps: readonly string[];
}
export interface SolvedMark {
  readonly id: string;
  /** The local day it was solved, or null for marks saved before dates were kept. */
  readonly date: string | null;
}
export interface EngagementInput {
  readonly progress: readonly ProgressEntry[];
  readonly solved: readonly SolvedMark[];
  /** Days from the local activity log (YYYY-MM-DD). */
  readonly activityDays: readonly string[];
  readonly groups: readonly CategoryIds[];
  readonly paths: readonly PathSteps[];
  /** The learner's local today, YYYY-MM-DD. */
  readonly today: string;
}

export interface Level {
  readonly level: number;
  /** XP earned inside this level and the XP this level needs, for a progress bar. */
  readonly into: number;
  readonly need: number;
}
export interface Streak {
  readonly current: number;
  readonly longest: number;
  /** False when the streak is still alive only because today has not happened yet. */
  readonly activeToday: boolean;
}
export interface Badge {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly earned: boolean;
  readonly value: number;
  readonly target: number;
}
export interface Engagement {
  readonly xp: number;
  readonly level: Level;
  readonly streak: Streak;
  readonly badges: readonly Badge[];
  readonly started: number;
  readonly completed: number;
  readonly solved: number;
  readonly completedPaths: readonly string[];
  /** The newest completion day (YYYY-MM-DD) per finished path, for certificates. */
  readonly pathFinishedOn: ReadonlyMap<string, string>;
}

/** Level n needs 100 + 50 (n - 1) XP to get through: 100, 150, 200, ... */
export function levelFor(xp: number): Level {
  let level = 1;
  let left = Math.max(0, Math.floor(xp));
  for (;;) {
    const need = 100 + 50 * (level - 1);
    if (left < need) return { level, into: left, need };
    left -= need;
    level++;
  }
}

const DAY = 86_400_000;
const utc = (day: string): number => {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const shift = (day: string, by: number): string => new Date(utc(day) + by * DAY).toISOString().slice(0, 10);

export function streakOf(days: ReadonlySet<string>, today: string): Streak {
  const alive = days.has(today) ? today : days.has(shift(today, -1)) ? shift(today, -1) : null;
  let current = 0;
  if (alive) for (let d = alive; days.has(d); d = shift(d, -1)) current++;
  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  for (const d of [...days].sort()) {
    const t = utc(d);
    run = previous !== null && t - previous === DAY ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = t;
  }
  return { current, longest, activeToday: days.has(today) };
}

const dayOfStamp = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : localDay(d);
};

export function computeEngagement(input: EngagementInput): Engagement {
  const known = new Set(input.groups.flatMap((g) => g.ids));
  const mine = input.progress.filter((p) => known.has(p.algorithmSlug));
  const completedIds = new Set(mine.filter((p) => p.status === "COMPLETED").map((p) => p.algorithmSlug));
  const solvedIds = new Set(input.solved.filter((s) => known.has(s.id)).map((s) => s.id));
  const started = mine.length;

  const completedPaths: string[] = [];
  const pathFinishedOn = new Map<string, string>();
  const finished = new Map(mine.map((p) => [p.algorithmSlug, dayOfStamp(p.completedAt)]));
  for (const p of input.paths) {
    if (p.steps.length > 0 && p.steps.every((s) => completedIds.has(s))) {
      completedPaths.push(p.id);
      const last = p.steps.map((s) => finished.get(s) ?? null).filter((d): d is string => d !== null).sort().pop();
      pathFinishedOn.set(p.id, last ?? input.today);
    }
  }

  const xp = started * XP.started + completedIds.size * XP.completed + solvedIds.size * XP.solved + completedPaths.length * XP.path;

  const days = new Set<string>(input.activityDays);
  for (const p of mine) for (const stamp of [p.firstViewedAt, p.lastViewedAt, p.completedAt]) { const d = dayOfStamp(stamp); if (d) days.add(d); }
  for (const s of input.solved) if (s.date) days.add(s.date);
  const streak = streakOf(days, input.today);

  const badge = (id: string, title: string, description: string, value: number, target: number): Badge => ({ id, title, description, earned: value >= target, value: Math.min(value, target), target });
  const badges: Badge[] = [
    badge("first-step", "First step", "Complete your first algorithm.", completedIds.size, 1),
    badge("explorer", "Explorer", "Open 10 different algorithms.", started, 10),
    badge("steady", "Steady learner", "Complete 10 algorithms.", completedIds.size, 10),
    badge("dedicated", "Dedicated", "Complete 25 algorithms.", completedIds.size, 25),
    badge("scholar", "Scholar", "Complete 50 algorithms.", completedIds.size, 50),
    badge("first-solve", "First solve", "Pass every test of a practice problem.", solvedIds.size, 1),
    badge("problem-solver", "Problem solver", "Solve 10 practice problems.", solvedIds.size, 10),
    badge("streak-3", "Three-day streak", "Learn on 3 days in a row.", streak.longest, 3),
    badge("streak-7", "One-week streak", "Learn on 7 days in a row.", streak.longest, 7),
    badge("streak-30", "One-month streak", "Learn on 30 days in a row.", streak.longest, 30),
    badge("path-finisher", "Path finisher", "Complete every algorithm of a learning path.", completedPaths.length, 1),
    ...input.paths.map((p) => badge(`path-${p.id}`, `Path: ${p.title}`, `Complete all ${p.steps.length} algorithms of "${p.title}".`, p.steps.filter((s) => completedIds.has(s)).length, p.steps.length)),
    ...input.groups.filter((g) => g.ids.length > 0).map((g) => badge(`master-${g.id}`, `Master of ${g.name}`, `Complete all ${g.ids.length} algorithms in ${g.name}.`, g.ids.filter((i) => completedIds.has(i)).length, g.ids.length)),
  ];

  return { xp, level: levelFor(xp), streak, badges, started, completed: completedIds.size, solved: solvedIds.size, completedPaths, pathFinishedOn };
}
