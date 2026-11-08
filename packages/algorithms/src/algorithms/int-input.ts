import { z } from "zod";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";

export interface IntOnlyField {
  readonly name: string;
  readonly label: string;
  readonly min: number;
  /** Fixed maximum, or one computed from the active limit profile. */
  readonly max: number | ((limits: LimitProfile) => number);
}

/** Validates an input made only of whole-number fields, with field-scoped messages. */
export function parseInts(raw: unknown, limits: LimitProfile, fields: readonly IntOnlyField[]): InputResult<Record<string, unknown>> {
  const bound = (f: IntOnlyField) => (typeof f.max === "function" ? f.max(limits) : f.max);
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    shape[f.name] = z
      .number({ error: `${f.label} must be a whole number.` })
      .int(`${f.label} must be a whole number.`)
      .min(f.min, `${f.label} must be between ${f.min} and ${bound(f)}.`)
      .max(bound(f), `${f.label} must be between ${f.min} and ${bound(f)}.`);
  }
  const parsed = z.strictObject(shape).safeParse(raw);
  if (!parsed.success) {
    const errors: FieldError[] = parsed.error.issues.map((i) => ({ field: String(i.path[0] ?? "input"), message: i.message }));
    return { ok: false, errors };
  }
  return { ok: true, value: parsed.data };
}
