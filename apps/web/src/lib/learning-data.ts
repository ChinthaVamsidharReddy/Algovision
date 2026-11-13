import { PATHS, getAlgorithm, listAlgorithms, pathsContaining, practiceFor, prerequisitesOf, resolveLimits, runAlgorithm, type PathLevel, type PracticeLink } from "@algovision/algorithms";
import { catalogCards, type CatalogCard } from "./catalog-cards";

/** Server-side data for the learning pages. Everything here is small, serialisable and computed at build time. */
export interface PathStep {
  readonly id: string;
  readonly title: string;
  readonly difficulty: CatalogCard["difficulty"];
  readonly time: string;
  readonly prerequisites: readonly { readonly id: string; readonly title: string }[];
}
export interface PathData {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly level: PathLevel;
  readonly outcomes: readonly string[];
  readonly steps: readonly PathStep[];
}

const titleOf = (id: string): string => getAlgorithm(id)?.content.meta.title ?? id;

export function pathData(): PathData[] {
  const cards = new Map(catalogCards().map((c) => [c.id, c]));
  return PATHS.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary,
    level: p.level,
    outcomes: p.outcomes,
    steps: p.steps.map((id): PathStep => {
      const c = cards.get(id)!;
      return { id, title: c.title, difficulty: c.difficulty, time: c.time, prerequisites: prerequisitesOf(id).map((p) => ({ id: p, title: titleOf(p) })) };
    }),
  }));
}

export interface AlgorithmExtrasData {
  readonly prerequisites: readonly { readonly id: string; readonly title: string }[];
  readonly paths: readonly { readonly id: string; readonly title: string }[];
  readonly practice: readonly PracticeLink[];
}
export function extrasFor(id: string): AlgorithmExtrasData {
  return {
    prerequisites: prerequisitesOf(id).map((p) => ({ id: p, title: titleOf(p) })),
    paths: pathsContaining(id).map((p) => ({ id: p.id, title: p.title })),
    practice: practiceFor(id),
  };
}

export interface CompareRow extends CatalogCard {
  /** Number of steps the animation takes on the algorithm's own example. */
  readonly exampleSteps: number;
  readonly exampleInput: string;
}

/** One row per algorithm for the compare page; the example step count comes from really running the default input. */
export function compareRows(): CompareRow[] {
  const limits = resolveLimits("standard");
  const byId = new Map(listAlgorithms().map((a) => [a.id, a]));
  return catalogCards().map((card): CompareRow => {
    const entry = byId.get(card.id)!;
    const input = entry.content.meta.defaultInput;
    const run = runAlgorithm(card.id, input, limits);
    return {
      ...card,
      exampleSteps: run.ok ? run.trace.steps.length : 0,
      exampleInput: Object.entries(input).map(([k, v]) => `${k} = ${Array.isArray(v) ? `[${v.join(", ")}]` : String(v)}`).join("; "),
    };
  });
}

export const COMPARE_SUGGESTIONS: readonly { readonly a: string; readonly b: string; readonly why: string }[] = [
  { a: "bubble-sort", b: "merge-sort", why: "Quadratic versus n log n" },
  { a: "linear-search", b: "binary-search", why: "Scan every item or halve the range" },
  { a: "bfs-traversal", b: "dfs-traversal", why: "Level by level versus as deep as possible" },
  { a: "fibonacci-recursive", b: "fibonacci-dp", why: "Repeated work versus a remembered table" },
  { a: "quick-sort", b: "merge-sort", why: "Partition first or merge last" },
  { a: "house-robber", b: "house-robber-circular", why: "A line of houses versus a circle" },
];
