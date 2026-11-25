import type { ExecutionStep } from "@algovision/trace-schema";
import type { StoryActor, StoryCell, Tone } from "./types";

type Step = ExecutionStep<"array">;

export const letterOf = (codes: readonly number[], i: number | null | undefined): string => (i !== null && i !== undefined && i >= 0 && i < codes.length ? String.fromCharCode(codes[i]!) : "");
export const textOf = (codes: readonly number[]): string => String.fromCharCode(...codes);
export const inRange = (i: number | null | undefined, n: number): i is number => i !== null && i !== undefined && i >= 0 && i < n;
export const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many);

/** The role of each cell from the highlights (the window role is left out: stories draw their own window). */
export function rolesOf(step: Step): Map<number, string> {
  const m = new Map<number, string>();
  for (const h of step.highlights) if (h.target.kind === "index") m.set(h.target.index, h.role);
  return m;
}
export function letterCells(step: Step, tone: (i: number, role: string | undefined) => Tone, sub?: (i: number) => string): StoryCell[] {
  const roles = rolesOf(step);
  return step.state.values.map((c, i) => ({ main: String.fromCharCode(c), sub: sub ? sub(i) : `${i + 1}`, tone: tone(i, roles.get(i)) }));
}
/** The two kids holding a window: the left one below the cells and the right one above, so they never hide each other. */
export function windowKids(left: number | null, right: number | null, n: number, names: [string, string] = ["Left", "Right"]): StoryActor[] {
  const out: StoryActor[] = [];
  if (inRange(left, n)) out.push({ id: "l", emoji: "👦", name: names[0], at: left, row: "bottom" });
  if (inRange(right, n)) out.push({ id: "r", emoji: "👧", name: names[1], at: right });
  return out;
}
/** The value a variable had at the step before this one (null at the first step). */
export function previousVariable(steps: readonly Step[], step: Step, name: string): number | null {
  if (step.index === 0) return null;
  const v = steps[step.index - 1]!.variables.find((x) => x.name === name)?.value;
  return typeof v === "number" ? v : null;
}
