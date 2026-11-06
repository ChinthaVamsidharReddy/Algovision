import { z } from "zod";
import { ElementRefSchema } from "./refs";

/**
 * Closed vocabulary of logical events (schema 1.x). Executors compose these; renderers and
 * the code panel never see language-specific details. Adding a type is a minor version change.
 */
export const EVENT_TYPES = [
  "init",
  "compare",
  "swap",
  "assign",
  "movePointer",
  "visit",
  "push",
  "pop",
  "peek",
  "enqueue",
  "dequeue",
  "insertNode",
  "removeNode",
  "link",
  "unlink",
  "found",
  "notFound",
  "overflow",
  "underflow",
  "call",
  "return",
  "done",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

const nodeId = z.string().min(1);
const scalar = z.union([z.number(), z.string(), z.boolean(), z.null()]);

export const TraceEventSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("init") }),
  z.strictObject({ type: z.literal("compare"), a: ElementRefSchema, b: ElementRefSchema }),
  z.strictObject({ type: z.literal("swap"), a: ElementRefSchema, b: ElementRefSchema }),
  z.strictObject({ type: z.literal("assign"), target: ElementRefSchema, value: scalar }),
  z.strictObject({
    type: z.literal("movePointer"),
    pointer: z.string().min(1),
    to: ElementRefSchema.nullable(),
  }),
  z.strictObject({ type: z.literal("visit"), element: ElementRefSchema }),
  z.strictObject({ type: z.literal("push"), element: ElementRefSchema }),
  z.strictObject({ type: z.literal("pop"), element: ElementRefSchema }),
  z.strictObject({ type: z.literal("peek"), element: ElementRefSchema }),
  z.strictObject({ type: z.literal("enqueue"), element: ElementRefSchema }),
  z.strictObject({ type: z.literal("dequeue"), element: ElementRefSchema }),
  z.strictObject({ type: z.literal("insertNode"), node: nodeId }),
  z.strictObject({ type: z.literal("removeNode"), node: nodeId }),
  z.strictObject({ type: z.literal("link"), from: nodeId, to: nodeId.nullable() }),
  z.strictObject({ type: z.literal("unlink"), from: nodeId, to: nodeId.nullable() }),
  z.strictObject({ type: z.literal("found"), element: ElementRefSchema }),
  z.strictObject({ type: z.literal("notFound") }),
  z.strictObject({ type: z.literal("overflow") }),
  z.strictObject({ type: z.literal("underflow") }),
  /** A recursive call starts / finishes. `node` is the argument; null is a call on an empty subtree. */
  z.strictObject({ type: z.literal("call"), node: nodeId.nullable() }),
  z.strictObject({ type: z.literal("return"), node: nodeId.nullable() }),
  z.strictObject({ type: z.literal("done") }),
]);
export type TraceEvent = z.infer<typeof TraceEventSchema>;
