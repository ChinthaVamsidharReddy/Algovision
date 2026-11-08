import { z } from "zod";
import { TraceEventSchema } from "./events";
import { ElementRefSchema } from "./refs";
import { ArrayStateSchema, LinkedListStateSchema, QueueStateSchema, GraphStateSchema, StackStateSchema, TreeStateSchema, type StateKind, type StateOf } from "./state";

export const HIGHLIGHT_ROLES = [
  "active",
  "compared",
  "swapped",
  "sorted",
  "visited",
  "pointer",
  "found",
  "window",
  "created",
] as const;
export type HighlightRole = (typeof HIGHLIGHT_ROLES)[number];

/** Where in the displayed source this step happens. */
export const SourceRefSchema = z.discriminatedUnion("kind", [
  /** MVP 1: a logical anchor, resolved per language through that language's line map. */
  z.strictObject({ kind: z.literal("anchor"), id: z.string().regex(/^[a-z][a-z0-9-]*$/) }),
  /** MVP 2: a real line number from a traced user program. */
  z.strictObject({ kind: z.literal("line"), line: z.number().int().min(1) }),
]);
export type SourceRef = z.infer<typeof SourceRefSchema>;

export const VariableSchema = z.strictObject({
  name: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean(), z.null()]),
  /** True when the value differs from the previous step; drives the "changed" marker. */
  changed: z.boolean(),
});
export type Variable = z.infer<typeof VariableSchema>;

export const HighlightSchema = z.strictObject({
  target: ElementRefSchema,
  role: z.enum(HIGHLIGHT_ROLES),
  label: z.string().min(1).optional(),
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const MotionSchema = z.strictObject({
  kind: z.enum(["swap", "slide", "appear", "disappear"]),
});

function stepSchema<S extends z.ZodType>(state: S) {
  return z.strictObject({
    /** 0-based and equal to the step's position in `steps`. */
    index: z.number().int().min(0),
    event: TraceEventSchema,
    source: SourceRefSchema,
    explanation: z.string().trim().min(1),
    variables: z.array(VariableSchema),
    state,
    changed: z.array(ElementRefSchema),
    highlights: z.array(HighlightSchema),
    motion: MotionSchema.optional(),
  });
}

const SummarySchema = z.strictObject({
  time: z.string().min(1),
  space: z.string().min(1),
  result: z.unknown(),
});

function traceSchema<K extends StateKind, S extends z.ZodType>(kind: K, state: S) {
  return z.strictObject({
    schemaVersion: z.string(),
    algorithmId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    stateKind: z.literal(kind),
    input: z.record(z.string(), z.unknown()),
    steps: z.array(stepSchema(state)).min(1),
    summary: SummarySchema,
  });
}

export const LinkedListTraceSchema = traceSchema("linkedList", LinkedListStateSchema);
export const ArrayTraceSchema = traceSchema("array", ArrayStateSchema);

export const StackTraceSchema = traceSchema("stack", StackStateSchema);
export const QueueTraceSchema = traceSchema("queue", QueueStateSchema);
export const TreeTraceSchema = traceSchema("tree", TreeStateSchema);
export const GraphTraceSchema = traceSchema("graph", GraphStateSchema);

/** Discriminated by `stateKind`. Add each new structure's trace schema here. */
export const ExecutionTraceSchema = z.discriminatedUnion("stateKind", [
  LinkedListTraceSchema,
  ArrayTraceSchema,
  StackTraceSchema,
  QueueTraceSchema,
  TreeTraceSchema,
  GraphTraceSchema,
]);

export type ExecutionTrace = z.infer<typeof ExecutionTraceSchema>;
export type ExecutionTraceOf<K extends StateKind> = Extract<ExecutionTrace, { stateKind: K }>;
export type ExecutionStep<K extends StateKind = StateKind> = ExecutionTraceOf<K>["steps"][number];
export type { StateOf };
