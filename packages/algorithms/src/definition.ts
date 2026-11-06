import type { ExecutionTrace } from "@algovision/trace-schema";
import type { InputResult } from "./input";
import type { LimitProfile } from "./limits";

export interface AlgorithmDefinition<I = unknown> {
  readonly id: string;
  /** Validates untrusted input (URL, form) against the active limit profile. */
  parseInput(raw: unknown, limits: LimitProfile): InputResult<I>;
  /** Pure and deterministic: same input and limits always give the same trace. May throw TraceLimitError. */
  run(input: I, limits: LimitProfile): ExecutionTrace;
}
