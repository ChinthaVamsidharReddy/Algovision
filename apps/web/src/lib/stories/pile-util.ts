import type { ExecutionStep } from "@algovision/trace-schema";
import type { PileTrace, Tone } from "./types";

type Step = ExecutionStep<"stack" | "queue">;

/** The numbers the algorithm was given (the `values` input). */
export const inputValues = (trace: PileTrace): number[] => {
  const v = trace.input.values;
  return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];
};
export const inputNumber = (trace: PileTrace, name: string): number | undefined => {
  const v = trace.input[name];
  return typeof v === "number" ? v : undefined;
};
export const variable = (step: Step, name: string): number | undefined => {
  const v = step.variables.find((x) => x.name === name)?.value;
  return typeof v === "number" ? v : undefined;
};
/** The highlight role the algorithm gives the item at a position, if any. */
export const roleAt = (step: Step, position: number): string | undefined => step.highlights.find((h) => h.target.kind === "index" && h.target.index === position)?.role;
export const toneOfRole = (role: string | undefined): Tone => (role === "created" ? "good" : role === "found" ? "good" : role === "active" ? "hit" : role === "compared" ? "warn" : role === "pointer" ? "warn" : "plain");
export const isLast = (step: Step, trace: PileTrace) => step.index === trace.steps.length - 1;
export const joined = (xs: readonly (number | string)[], empty = "nothing yet") => (xs.length ? xs.join(", ") : empty);
export const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
