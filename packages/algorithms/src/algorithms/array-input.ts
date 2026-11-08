import { z } from "zod";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";

export interface IntField {
  readonly name: string;
  readonly label: string;
  /** Inclusive bounds; defaults to ±maxAbsValue. May depend on the parsed array. */
  readonly min?: (values: readonly number[], limits: LimitProfile) => number;
  readonly max?: (values: readonly number[], limits: LimitProfile) => number;
  readonly rangeMessage?: (values: readonly number[], limits: LimitProfile) => string;
}

export interface ArraySpec {
  readonly noun?: string;
  /** Extra integer inputs, in declaration order. */
  readonly fields?: readonly IntField[];
  readonly sortedMessage?: string;
  readonly minLength?: number;
  readonly minLengthMessage?: string;
  /** Maximum array length override (e.g. insertion needs room for one more value). */
  readonly maxLength?: (limits: LimitProfile) => number;
  readonly valueMin?: number;
  readonly valueMax?: number;
  readonly valueMessage?: string;
}

/** Validates {values, ...extra integer fields} with human-readable, field-scoped messages. */
export function parseArrayWithFields(raw: unknown, limits: LimitProfile, spec: ArraySpec): InputResult<Record<string, unknown>> {
  const max = spec.valueMax ?? limits.maxAbsValue;
  const lo = spec.valueMin ?? -max;
  const whole = (what: string, a: number, b: number, message?: string) =>
    z
      .number({ error: `${what} must be a whole number.` })
      .int(`${what} must be a whole number.`)
      .min(a, message ?? `${what} must be between ${a} and ${b}.`)
      .max(b, message ?? `${what} must be between ${a} and ${b}.`);
  const noun = spec.noun ?? "array";
  const maxLen = spec.maxLength ? spec.maxLength(limits) : limits.maxArrayLength;
  const shape: Record<string, z.ZodType> = {
    values: z
      .array(whole("Each array value", lo, max, spec.valueMessage), { error: "Array values must be a list of numbers." })
      .max(maxLen, `The ${noun} can have at most ${maxLen} values.`),
  };
  for (const f of spec.fields ?? []) shape[f.name] = z.number({ error: `${f.label} must be a whole number.` }).int(`${f.label} must be a whole number.`);
  const parsed = z.strictObject(shape).safeParse(raw);
  if (!parsed.success) {
    const errors: FieldError[] = parsed.error.issues.map((issue) => ({ field: String(issue.path[0] ?? "input"), message: issue.message }));
    return { ok: false, errors };
  }
  const data = parsed.data as Record<string, number | number[]>;
  const values = data.values as number[];
  const errors: FieldError[] = [];
  if (spec.minLength !== undefined && values.length < spec.minLength) {
    errors.push({ field: "values", message: spec.minLengthMessage ?? `Enter at least ${spec.minLength} value${spec.minLength === 1 ? "" : "s"}.` });
  }
  if (spec.sortedMessage && values.some((v, i) => i > 0 && v < values[i - 1]!)) {
    errors.push({ field: "values", message: spec.sortedMessage });
  }
  for (const f of spec.fields ?? []) {
    const v = data[f.name] as number;
    const a = f.min ? f.min(values, limits) : -max;
    const b = f.max ? f.max(values, limits) : max;
    if (v < a || v > b) {
      errors.push({ field: f.name, message: f.rangeMessage ? f.rangeMessage(values, limits) : `${f.label} must be between ${a} and ${b}.` });
    }
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: data };
}
