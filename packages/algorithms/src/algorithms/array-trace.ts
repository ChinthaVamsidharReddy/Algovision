import { indexRef, type ExecutionTrace, type Highlight, type TraceEvent } from "@algovision/trace-schema";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder, type Scalar } from "../trace-builder";
import { ptr, snapshot } from "./array-common";
import { parseArrayWithFields, type ArraySpec } from "./array-input";

export { cell, fmt, ptr } from "./array-common";
export { indexRef };

/** Step bookkeeping for array algorithms: the array may change; pointers are indexes (null when off the array). */
export class ArrayTrace {
  readonly values: number[];
  private readonly b: TraceBuilder<"array">;

  private readonly chars: boolean;

  /** `chars: true` marks the values as character codes so cells are drawn as letters (schema 1.3). */
  constructor(id: string, input: Record<string, unknown>, values: readonly number[], limits: LimitProfile, chars = false) {
    this.values = [...values];
    this.chars = chars;
    this.b = new TraceBuilder({ algorithmId: id, stateKind: "array", input, maxSteps: limits.maxSteps });
  }

  step(event: TraceEvent, anchor: string, explanation: string, variables: Record<string, Scalar>, pointers: Record<string, number | null> = {}, highlights: readonly Highlight[] = [], changed: readonly number[] = []): void {
    const clean: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(pointers)) clean[k] = v === null ? null : ptr(v, this.values.length);
    this.b.step({
      event, anchor, explanation, variables, state: snapshot(this.values, clean, this.chars), highlights: [...highlights],
      ...(changed.length > 0 ? { changed: changed.map((i) => indexRef(i)) } : {}),
    });
  }

  finish(result: unknown, time: string, space: string): ExecutionTrace {
    return this.b.build({ time, space, result });
  }
}

/** parseArrayWithFields plus a check on the parsed value that returns field-scoped messages. */
export function parseChecked<T>(raw: unknown, limits: LimitProfile, spec: ArraySpec, check: (v: T) => FieldError[]): InputResult<T> {
  const p = parseArrayWithFields(raw, limits, spec) as InputResult<T>;
  if (!p.ok) return p;
  const errors = check(p.value);
  return errors.length > 0 ? { ok: false, errors } : p;
}
