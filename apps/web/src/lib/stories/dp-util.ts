import type { ExecutionStep } from "@algovision/trace-schema";
import type { ArrayTrace, StoryCell, StoryActor } from "./types";
import { roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

type Step = ExecutionStep<"array">;

/** Table cells the algorithm has filled in or set up so far (its "created" and "sorted" highlights up to this step). */
export function filledSet(trace: ArrayTrace, step: Step): Set<number> {
  const s = new Set<number>();
  for (const t of trace.steps) {
    if (t.index > step.index) break;
    for (const h of t.highlights) if (h.target.kind === "index" && (h.role === "created" || h.role === "sorted")) s.add(h.target.index);
  }
  return s;
}
/** The list the algorithm was given (the `values` input). */
export const inputList = (trace: ArrayTrace): number[] => {
  const v = trace.input?.values;
  return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];
};
export const inputNumber = (trace: ArrayTrace, name: string): number => {
  const v = trace.input?.[name];
  return typeof v === "number" ? v : 0;
};
export const cellAt = (step: Step, i: number): number => step.state.values[i] ?? 0;
/** A dp table drawn as a row: cells not yet written show a dash. */
export function tableCells(step: Step, trace: ArrayTrace, sub: (i: number) => string, text: (v: number) => string = String): StoryCell[] {
  const roles = rolesOf(step);
  const filled = filledSet(trace, step);
  return step.state.values.map((v, i) => (filled.has(i) ? { main: text(v), sub: sub(i), tone: roleTone(roles.get(i)) } : { main: "–", sub: sub(i), tone: roles.get(i) ? roleTone(roles.get(i)) : "dim" }));
}
/** One helper standing over cell `at`, when there is one. */
export const helperAt = (emoji: string, name: string, at: number | null | undefined, n: number): StoryActor[] => (at !== null && at !== undefined && at >= 0 && at < n ? [{ id: "h", emoji, name, at }] : []);
