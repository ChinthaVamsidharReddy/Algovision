import { z } from "zod";

/**
 * Per-structure state snapshots. Every step stores a FULL snapshot so previous, next and jump
 * are plain index changes. A new structure (array, stack, queue, tree, graph) is added here with
 * its own schema when the wave that needs it begins; the kind list is deliberately not
 * pre-filled with schemas nothing can render yet.
 */

export const LinkedListNodeSchema = z.strictObject({
  id: z.string().min(1),
  value: z.number().int(),
  next: z.string().min(1).nullable(),
});
export type LinkedListNode = z.infer<typeof LinkedListNodeSchema>;

export const LinkedListStateSchema = z.strictObject({
  kind: z.literal("linkedList"),
  /** Every node that exists, reachable from head or not (a freshly created node is detached). */
  nodes: z.array(LinkedListNodeSchema),
  head: z.string().min(1).nullable(),
  /** Extra named pointers such as `current` or `prev`; node ids or null. */
  pointers: z.record(z.string().min(1), z.string().min(1).nullable()),
});
export type LinkedListState = z.infer<typeof LinkedListStateSchema>;

export const ArrayStateSchema = z.strictObject({
  kind: z.literal("array"),
  values: z.array(z.number().int()),
  /** Named index pointers such as `low`, `mid`, `high`, `i`, `j`; null when not pointing at a cell. */
  pointers: z.record(z.string().min(1), z.number().int().min(0).nullable()),
  /** Schema 1.3: when true, `values` are character codes and cells are drawn as characters (string algorithms). */
  chars: z.boolean().optional(),
});
export type ArrayState = z.infer<typeof ArrayStateSchema>;

/** Stack: `items[0]` is the bottom, the last item is the top. */
export const StackStateSchema = z.strictObject({
  kind: z.literal("stack"),
  items: z.array(z.number().int()),
});
export type StackState = z.infer<typeof StackStateSchema>;

/** Queue: `items[0]` is the front (next to leave), the last item is the rear (last to arrive). */
export const QueueStateSchema = z.strictObject({
  kind: z.literal("queue"),
  items: z.array(z.number().int()),
});
export type QueueState = z.infer<typeof QueueStateSchema>;

export const TreeNodeSchema = z.strictObject({
  id: z.string().min(1),
  value: z.number().int(),
  left: z.string().min(1).nullable(),
  right: z.string().min(1).nullable(),
});
export type TreeNode = z.infer<typeof TreeNodeSchema>;

/**
 * Binary tree traversal snapshot. `callStack` lists the active recursive calls from the outermost
 * to the innermost (a null entry is a call on an empty subtree); `output` is what the traversal
 * has produced so far.
 */
export const TreeStateSchema = z.strictObject({
  kind: z.literal("tree"),
  nodes: z.array(TreeNodeSchema),
  root: z.string().min(1).nullable(),
  current: z.string().min(1).nullable(),
  callStack: z.array(z.string().min(1).nullable()),
  output: z.array(z.number().int()),
});
export type TreeState = z.infer<typeof TreeStateSchema>;

export const GraphNodeSchema = z.strictObject({
  id: z.string().min(1),
  /** The vertex number shown inside the circle. */
  value: z.number().int(),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeSchema = z.strictObject({
  from: z.string().min(1),
  to: z.string().min(1),
  /** Present for weighted graphs. */
  weight: z.number().int().nullable(),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

/**
 * Graph snapshot (schema 1.2). `frontier` is the work list the algorithm is using (a queue, a
 * stack or the recursion call stack) and `frontierName` says which; `marks` is one number per
 * vertex (distance, parent, component or in-degree) named by `markName`; null means "not set yet".
 * `activeEdge` is the edge being examined right now.
 */
export const GraphStateSchema = z.strictObject({
  kind: z.literal("graph"),
  directed: z.boolean(),
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  current: z.string().min(1).nullable(),
  activeEdge: z.strictObject({ from: z.string().min(1), to: z.string().min(1) }).nullable(),
  frontier: z.array(z.string().min(1)),
  frontierName: z.string(),
  visited: z.array(z.string().min(1)),
  marks: z.record(z.string().min(1), z.number().int().nullable()),
  markName: z.string(),
  output: z.array(z.number().int()),
});
export type GraphState = z.infer<typeof GraphStateSchema>;

export const STATE_KINDS = ["linkedList", "array", "stack", "queue", "tree", "graph"] as const;
export type StateKind = (typeof STATE_KINDS)[number];

export const stateSchemas = {
  linkedList: LinkedListStateSchema,
  array: ArrayStateSchema,
  stack: StackStateSchema,
  queue: QueueStateSchema,
  tree: TreeStateSchema,
  graph: GraphStateSchema,
} as const;

export interface StateMap {
  linkedList: LinkedListState;
  array: ArrayState;
  stack: StackState;
  queue: QueueState;
  tree: TreeState;
  graph: GraphState;
}
export type StateOf<K extends StateKind> = StateMap[K];
