import type { ProgressEntry } from "./learning-client";

export interface Tally {
  readonly done: number;
  readonly started: number;
  readonly total: number;
  /** Whole percent of completed algorithms, 0-100. */
  readonly percent: number;
}

function tally(slugs: readonly string[], progress: ReadonlyMap<string, ProgressEntry>): Tally {
  const total = slugs.length;
  const done = slugs.filter((s) => progress.get(s)?.status === "COMPLETED").length;
  const started = slugs.filter((s) => progress.get(s)?.status === "IN_PROGRESS").length;
  return { done, started, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export interface CategoryIds {
  readonly id: string;
  readonly name: string;
  readonly ids: readonly string[];
}

export interface ProgressSummary {
  readonly overall: Tally;
  readonly byCategory: readonly { readonly id: string; readonly name: string; readonly tally: Tally }[];
  /** The most recently viewed algorithm that is not finished, to resume. */
  readonly resume: ProgressEntry | null;
}

/** Progress is counted against the algorithms that exist now; entries for removed algorithms are ignored. */
export function summarize(groups: readonly CategoryIds[], progress: ReadonlyMap<string, ProgressEntry>): ProgressSummary {
  const all = groups.flatMap((g) => g.ids);
  const known = new Set(all);
  const resume =
    [...progress.values()]
      .filter((p) => p.status === "IN_PROGRESS" && known.has(p.algorithmSlug))
      .sort((a, b) => b.lastViewedAt.localeCompare(a.lastViewedAt))[0] ?? null;
  return {
    overall: tally(all, progress),
    byCategory: groups.map((g) => ({ id: g.id, name: g.name, tally: tally(g.ids, progress) })),
    resume,
  };
}
