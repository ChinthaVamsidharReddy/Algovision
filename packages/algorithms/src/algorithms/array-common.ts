import { z } from "zod";
import { indexRef, type ArrayState, type Highlight, type HighlightRole } from "@algovision/trace-schema";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";

export const fmt = (values: readonly number[]): string => (values.length === 0 ? "[]" : `[${values.join(", ")}]`);

/** An index pointer that is null when it points outside the array (e.g. high = -1 on an empty window). */
export const ptr = (index: number, size: number): number | null => (index >= 0 && index < size ? index : null);

export function snapshot(values: readonly number[], pointers: Record<string, number | null>, chars = false): ArrayState {
  return { kind: "array", values: [...values], pointers, ...(chars ? { chars: true } : {}) };
}

export const cell = (index: number, role: HighlightRole, label?: string): Highlight => ({
  target: indexRef(index),
  role,
  ...(label ? { label } : {}),
});

export interface ParseOptions {
  readonly target: boolean;
  readonly sorted: boolean;
  /** What the list is called in messages; defaults to "array". */
  readonly noun?: string;
}

/** Validates {values, target?} against the active limit profile with human-readable messages. */
export function parseArrayInput(raw: unknown, limits: LimitProfile, options: ParseOptions): InputResult<Record<string, unknown>> {
  const max = limits.maxAbsValue;
  const whole = (what: string) =>
    z
      .number({ error: `${what} must be a whole number.` })
      .int(`${what} must be a whole number.`)
      .min(-max, `${what} must be between -${max} and ${max}.`)
      .max(max, `${what} must be between -${max} and ${max}.`);
  const shape: Record<string, z.ZodType> = {
    values: z
      .array(whole("Each array value"), { error: "Array values must be a list of numbers." })
      .max(limits.maxArrayLength, `The ${options.noun ?? "array"} can have at most ${limits.maxArrayLength} values.`),
  };
  if (options.target) shape.target = whole("The value to find");
  const parsed = z.strictObject(shape).safeParse(raw);
  if (!parsed.success) {
    const errors: FieldError[] = parsed.error.issues.map((issue) => ({
      field: String(issue.path[0] ?? "input"),
      message: issue.message,
    }));
    return { ok: false, errors };
  }
  const data = parsed.data as { values: number[] };
  if (options.sorted && data.values.some((v, i) => i > 0 && v < data.values[i - 1]!)) {
    return { ok: false, errors: [{ field: "values", message: "Values must be in ascending order for binary search." }] };
  }
  return { ok: true, value: parsed.data };
}
