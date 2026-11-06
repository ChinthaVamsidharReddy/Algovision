import { z } from "zod";
import { indexRef, type Highlight, type HighlightRole, type QueueState, type StackState } from "@algovision/trace-schema";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";

export { fmt } from "./array-common";

export const stackSnapshot = (items: readonly number[]): StackState => ({ kind: "stack", items: [...items] });
export const queueSnapshot = (items: readonly number[]): QueueState => ({ kind: "queue", items: [...items] });

export const slot = (index: number, role: HighlightRole, label?: string): Highlight => ({
  target: indexRef(index),
  role,
  ...(label ? { label } : {}),
});

/**
 * Validates {values, <countField>} for stack and queue demos: `values` are added in order, then
 * `countField` removals are attempted. The count may exceed the number of values on purpose, so
 * learners can see underflow, but it is bounded by the same length limit as the list.
 */
export function parseSequenceInput(
  raw: unknown,
  limits: LimitProfile,
  countField: "pops" | "removes",
): InputResult<Record<string, unknown>> {
  const max = limits.maxAbsValue;
  const value = z
    .number({ error: "Each value must be a whole number." })
    .int("Each value must be a whole number.")
    .min(-max, `Values must be between -${max} and ${max}.`)
    .max(max, `Values must be between -${max} and ${max}.`);
  const noun = countField === "pops" ? "pops" : "removals";
  const count = z
    .number({ error: `The number of ${noun} must be a whole number.` })
    .int(`The number of ${noun} must be a whole number.`)
    .min(0, `The number of ${noun} cannot be negative.`)
    .max(limits.maxArrayLength, `The number of ${noun} can be at most ${limits.maxArrayLength}.`);
  const parsed = z
    .strictObject({
      values: z
        .array(value, { error: "Values must be a list of numbers." })
        .max(limits.maxArrayLength, `You can add at most ${limits.maxArrayLength} values.`),
      [countField]: count,
    })
    .safeParse(raw);
  if (!parsed.success) {
    const errors: FieldError[] = parsed.error.issues.map((issue) => ({
      field: String(issue.path[0] ?? "input"),
      message: issue.message,
    }));
    return { ok: false, errors };
  }
  return { ok: true, value: parsed.data };
}
