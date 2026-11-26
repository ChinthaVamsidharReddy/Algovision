import type { ExecutionStep } from "@algovision/trace-schema";
import type { StoryCell, Tone } from "./types";
import { rolesOf } from "./string-util";

type Step = ExecutionStep<"array">;

/** Colours for the sorting stories: finished places are green, the working range stays plain, what is out of play fades. */
export function sortTone(role: string | undefined): Tone {
  switch (role) {
    case "active":
      return "hit";
    case "compared":
    case "swapped":
      return "warn";
    case "found":
    case "sorted":
    case "created":
      return "good";
    case "visited":
      return "dim";
    default:
      return "plain";
  }
}
export function sortCells(step: Step, sub: (i: number) => string): StoryCell[] {
  const roles = rolesOf(step);
  return step.state.values.map((v, i) => ({ main: String(v), sub: sub(i), tone: sortTone(roles.get(i)) }));
}
/** Every index that carries a highlight with this role, in order. */
export function indexesWithRole(step: Step, role: string): number[] {
  const out: number[] = [];
  for (const h of step.highlights) if (h.target.kind === "index" && h.role === role) out.push(h.target.index);
  return out;
}
/** The index of the highlight that has this label (for example the pivot). */
export function indexLabelled(step: Step, label: string): number | undefined {
  for (const h of step.highlights) if (h.target.kind === "index" && h.label === label) return h.target.index;
  return undefined;
}
export const listOf = (xs: readonly number[]): string => (xs.length ? xs.join(", ") : "nothing");
export const isLast = (step: Step, trace: { steps: readonly unknown[] }): boolean => step.index === trace.steps.length - 1;
