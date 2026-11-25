import type { ExecutionStep } from "@algovision/trace-schema";
import type { StoryCell, Tone } from "./types";
import { rolesOf } from "./string-util";

type Step = ExecutionStep<"array">;

/** Colours shared by the hash and queue stories, from the roles the algorithm already highlights. */
export function roleTone(role: string | undefined): Tone {
  switch (role) {
    case "active":
      return "hit";
    case "compared":
    case "swapped":
      return "warn";
    case "created":
    case "found":
      return "good";
    case "visited":
      return "dim";
    default:
      return "plain";
  }
}
/** One cell per array position; `empty` says which values mean "nothing here" and are drawn as a dash. */
export function slotCells(step: Step, empty: number, subText: (i: number) => string): StoryCell[] {
  const roles = rolesOf(step);
  return step.state.values.map((v, i) => ({ main: v === empty ? "–" : String(v), sub: subText(i), tone: roleTone(roles.get(i)) }));
}
/** The label a highlight put on a cell (for example "count 2"), if any. */
export function labelAt(step: Step, index: number): string | undefined {
  for (const h of step.highlights) if (h.target.kind === "index" && h.target.index === index && h.label) return h.label;
  return undefined;
}
export function indexWithRole(step: Step, role: string): number | undefined {
  for (const h of step.highlights) if (h.target.kind === "index" && h.role === role) return h.target.index;
  return undefined;
}
export const joined = (xs: readonly (string | number)[], none: string): string => (xs.length ? xs.join(", ") : none);

/** 0..1 bar lengths for a row of numbers, so the tallest is full and the smallest is still visible. */
export function barsOf(values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return values.map((v) => (hi === lo ? 0.6 : 0.15 + (0.85 * (v - lo)) / (hi - lo)));
}
/** Cells outside the half-open or closed range stay dim; the range is given as low (inclusive) and a last index (inclusive). */
export const outside = (i: number, low: number | null, last: number | null): boolean => low !== null && last !== null && (i < low || i > last);
