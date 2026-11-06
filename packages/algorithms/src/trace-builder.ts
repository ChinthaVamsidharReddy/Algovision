import {
  TRACE_SCHEMA_VERSION,
  type ElementRef,
  type ExecutionStep,
  type ExecutionTraceOf,
  type Highlight,
  type StateKind,
  type StateOf,
  type TraceEvent,
} from "@algovision/trace-schema";

export type Scalar = number | string | boolean | null;

export class TraceLimitError extends Error {
  constructor(readonly maxSteps: number) {
    super(`This input would produce more than ${maxSteps} steps. Try a smaller input.`);
    this.name = "TraceLimitError";
  }
}

export interface StepInput<K extends StateKind> {
  readonly event: TraceEvent;
  readonly anchor: string;
  readonly explanation: string;
  /** Current values of the variables to display; `changed` is derived by comparing with the previous step. */
  readonly variables: Readonly<Record<string, Scalar>>;
  readonly state: StateOf<K>;
  readonly changed?: readonly ElementRef[];
  readonly highlights?: readonly Highlight[];
  readonly motion?: "swap" | "slide" | "appear" | "disappear";
}

export interface TraceBuilderOptions<K extends StateKind> {
  readonly algorithmId: string;
  readonly stateKind: K;
  readonly input: Record<string, unknown>;
  readonly maxSteps: number;
}

/**
 * Collects steps into a full-snapshot trace. Executors describe what happened; the builder owns
 * indexing, deep-copying state via a JSON round trip (traces are JSON by contract; so later mutation cannot rewrite history), the `changed` flag on
 * variables, and the step limit.
 */
export class TraceBuilder<K extends StateKind> {
  private readonly steps: ExecutionStep<K>[] = [];
  private previous: Readonly<Record<string, Scalar>> = {};

  constructor(private readonly options: TraceBuilderOptions<K>) {}

  step(input: StepInput<K>): void {
    if (this.steps.length >= this.options.maxSteps) throw new TraceLimitError(this.options.maxSteps);
    const variables = Object.entries(input.variables).map(([name, value]) => ({
      name,
      value,
      changed: !(name in this.previous) || this.previous[name] !== value,
    }));
    this.previous = input.variables;
    const step = {
      index: this.steps.length,
      event: input.event,
      source: { kind: "anchor" as const, id: input.anchor },
      explanation: input.explanation,
      variables,
      state: JSON.parse(JSON.stringify(input.state)) as StateOf<K>,
      changed: [...(input.changed ?? [])],
      highlights: [...(input.highlights ?? [])],
      ...(input.motion ? { motion: { kind: input.motion } } : {}),
    };
    // The schema (validated by tests and at the app boundary) is the authority on step shape.
    this.steps.push(step as unknown as ExecutionStep<K>);
  }

  get length(): number {
    return this.steps.length;
  }

  build(summary: { time: string; space: string; result: unknown }): ExecutionTraceOf<K> {
    return {
      schemaVersion: TRACE_SCHEMA_VERSION,
      algorithmId: this.options.algorithmId,
      stateKind: this.options.stateKind,
      input: this.options.input,
      steps: this.steps,
      summary,
    } as unknown as ExecutionTraceOf<K>;
  }
}
