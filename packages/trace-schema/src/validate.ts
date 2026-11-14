import type { ElementRef } from "./refs";
import type { ArrayState, GraphState, LinkedListState, QueueState, StackState, TreeState } from "./state";
import {
  ExecutionTraceSchema,
  type ExecutionStep,
  type ExecutionTrace,
} from "./trace";
import { isSupportedSchemaVersion, TRACE_SCHEMA_VERSION } from "./version";

export const DEFAULT_MAX_STEPS = 2000;

export interface TraceIssue {
  /** Step index the problem belongs to, or null for trace-level problems. */
  step: number | null;
  path: string;
  message: string;
}

export interface ValidateOptions {
  maxSteps?: number;
}

export type ValidationResult =
  | { ok: true; trace: ExecutionTrace }
  | { ok: false; issues: TraceIssue[] };

/** Structural validation (Zod) followed by semantic validation (references, order, limits). */
export function validateTrace(data: unknown, options: ValidateOptions = {}): ValidationResult {
  const parsed = ExecutionTraceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => {
        const path = issue.path.map(String).join(".");
        const stepMatch = /^steps\.(\d+)/.exec(path);
        return {
          step: stepMatch ? Number(stepMatch[1]) : null,
          path,
          message: issue.message,
        };
      }),
    };
  }
  const issues = validateTraceSemantics(parsed.data, options);
  return issues.length === 0 ? { ok: true, trace: parsed.data } : { ok: false, issues };
}

export function assertValidTrace(data: unknown, options: ValidateOptions = {}): ExecutionTrace {
  const result = validateTrace(data, options);
  if (!result.ok) {
    const summary = result.issues
      .slice(0, 5)
      .map((i) => `${i.path || "trace"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid execution trace (${result.issues.length} issue(s)): ${summary}`);
  }
  return result.trace;
}

export function validateTraceSemantics(
  trace: ExecutionTrace,
  options: ValidateOptions = {},
): TraceIssue[] {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const issues: TraceIssue[] = [];
  const add = (step: number | null, path: string, message: string) =>
    issues.push({ step, path, message });

  if (!isSupportedSchemaVersion(trace.schemaVersion)) {
    add(
      null,
      "schemaVersion",
      `unsupported schema version "${trace.schemaVersion}" (this build understands ${TRACE_SCHEMA_VERSION})`,
    );
  }
  if (trace.steps.length > maxSteps) {
    add(null, "steps", `trace has ${trace.steps.length} steps, limit is ${maxSteps}`);
  }

  trace.steps.forEach((step, position) => {
    if (step.index !== position) {
      add(position, `steps.${position}.index`, `expected index ${position}, found ${step.index}`);
    }
    const names = new Set<string>();
    for (const variable of step.variables) {
      if (names.has(variable.name)) {
        add(position, `steps.${position}.variables`, `duplicate variable "${variable.name}"`);
      }
      names.add(variable.name);
    }
    switch (trace.stateKind) {
      case "linkedList":
        validateLinkedListStep(step as ExecutionStep<"linkedList">, position, add);
        break;
      case "array":
        validateArrayStep(step as ExecutionStep<"array">, position, add);
        break;
      case "stack":
        validateSequenceStep("stack", step as ExecutionStep<"stack">, position, add);
        break;
      case "queue":
        validateSequenceStep("queue", step as ExecutionStep<"queue">, position, add);
        break;
      case "tree":
        validateTreeStep(step as ExecutionStep<"tree">, position, add);
        break;
      case "graph":
        validateGraphStep(step as ExecutionStep<"graph">, position, add);
        break;
      case "grid":
        validateGridStep(step as ExecutionStep<"grid">, position, add);
        break;
    }
  });

  return issues;
}

type AddIssue = (step: number | null, path: string, message: string) => void;

function validateLinkedListStep(
  step: ExecutionStep<"linkedList">,
  position: number,
  add: AddIssue,
): void {
  const state: LinkedListState = step.state;
  const base = `steps.${position}`;
  const ids = new Set<string>();
  for (const node of state.nodes) {
    if (ids.has(node.id)) add(position, `${base}.state.nodes`, `duplicate node id "${node.id}"`);
    ids.add(node.id);
  }
  for (const node of state.nodes) {
    if (node.next !== null && !ids.has(node.next)) {
      add(position, `${base}.state.nodes`, `node "${node.id}" points to missing node "${node.next}"`);
    }
  }
  if (state.head !== null && !ids.has(state.head)) {
    add(position, `${base}.state.head`, `head points to missing node "${state.head}"`);
  }
  for (const [name, target] of Object.entries(state.pointers)) {
    if (target !== null && !ids.has(target)) {
      add(position, `${base}.state.pointers.${name}`, `pointer points to missing node "${target}"`);
    }
  }
  if (hasCycle(state)) {
    add(position, `${base}.state.nodes`, "the next pointers form a cycle");
  }

  const checkRef = (ref: ElementRef, path: string) => {
    if (ref.kind !== "node") {
      add(position, path, "linked list traces may only reference nodes by id");
    } else if (!ids.has(ref.id)) {
      add(position, path, `references missing node "${ref.id}"`);
    }
  };
  step.changed.forEach((ref, i) => checkRef(ref, `${base}.changed.${i}`));
  step.highlights.forEach((h, i) => checkRef(h.target, `${base}.highlights.${i}.target`));

  const event = step.event;
  switch (event.type) {
    case "insertNode":
      if (!ids.has(event.node)) {
        add(position, `${base}.event.node`, `inserted node "${event.node}" is not in the state`);
      }
      break;
    case "link":
      if (!ids.has(event.from)) add(position, `${base}.event.from`, `missing node "${event.from}"`);
      if (event.to !== null && !ids.has(event.to)) {
        add(position, `${base}.event.to`, `missing node "${event.to}"`);
      }
      break;
    case "unlink":
      if (!ids.has(event.from)) add(position, `${base}.event.from`, `missing node "${event.from}"`);
      break;
    case "movePointer":
      if (event.to) checkRef(event.to, `${base}.event.to`);
      break;
    default:
      break;
  }
}

function validateArrayStep(step: ExecutionStep<"array">, position: number, add: AddIssue): void {
  const state: ArrayState = step.state;
  const base = `steps.${position}`;
  const size = state.values.length;

  for (const [name, index] of Object.entries(state.pointers)) {
    if (index !== null && index >= size) {
      add(position, `${base}.state.pointers.${name}`, `pointer index ${index} is outside the array (size ${size})`);
    }
  }

  const checkRef = (ref: ElementRef, path: string) => {
    if (ref.kind !== "index") add(position, path, "array traces may only reference cells by index");
    else if (ref.index >= size) add(position, path, `index ${ref.index} is outside the array (size ${size})`);
  };
  step.changed.forEach((ref, i) => checkRef(ref, `${base}.changed.${i}`));
  step.highlights.forEach((h, i) => checkRef(h.target, `${base}.highlights.${i}.target`));

  const event = step.event;
  switch (event.type) {
    case "compare":
    case "swap":
      checkRef(event.a, `${base}.event.a`);
      checkRef(event.b, `${base}.event.b`);
      break;
    case "assign":
      checkRef(event.target, `${base}.event.target`);
      break;
    case "visit":
    case "found":
      checkRef(event.element, `${base}.event.element`);
      break;
    case "movePointer":
      if (event.to) checkRef(event.to, `${base}.event.to`);
      break;
    default:
      break;
  }
}

const SEQUENCE_EVENTS = {
  stack: ["init", "push", "pop", "peek", "overflow", "underflow", "done"],
  queue: ["init", "enqueue", "dequeue", "peek", "overflow", "underflow", "done"],
} as const;

/**
 * Stacks and queues share one rule set. Cells are addressed by index in `items`; the add event
 * must point at the new last cell, peek at the cell that would leave next, and remove events at
 * the vacated slot (which is at most `size` because the item is already gone from the snapshot).
 */
function validateSequenceStep(
  kind: "stack" | "queue",
  step: ExecutionStep<"stack"> | ExecutionStep<"queue">,
  position: number,
  add: AddIssue,
): void {
  const state: StackState | QueueState = step.state;
  const base = `steps.${position}`;
  const size = state.items.length;
  const event = step.event;

  if (!(SEQUENCE_EVENTS[kind] as readonly string[]).includes(event.type)) {
    add(position, `${base}.event.type`, `a ${kind} trace cannot use the "${event.type}" event`);
  }

  const checkRef = (ref: ElementRef, path: string, allowVacated = false) => {
    if (ref.kind !== "index") add(position, path, `${kind} traces may only reference items by index`);
    else if (ref.index > size || (ref.index === size && !allowVacated)) {
      add(position, path, `index ${ref.index} is outside the ${kind} (size ${size})`);
    }
  };
  step.changed.forEach((ref, i) => checkRef(ref, `${base}.changed.${i}`));
  step.highlights.forEach((h, i) => checkRef(h.target, `${base}.highlights.${i}.target`));

  switch (event.type) {
    case "push":
    case "enqueue":
      checkRef(event.element, `${base}.event.element`);
      if (event.element.kind === "index" && event.element.index !== size - 1) {
        add(position, `${base}.event.element`, `the added item must be the last one (index ${size - 1})`);
      }
      break;
    case "peek": {
      checkRef(event.element, `${base}.event.element`);
      const expected = kind === "stack" ? size - 1 : 0;
      if (event.element.kind === "index" && event.element.index !== expected) {
        add(position, `${base}.event.element`, `peek must look at index ${expected}`);
      }
      break;
    }
    case "pop":
    case "dequeue":
      checkRef(event.element, `${base}.event.element`, true);
      break;
    default:
      break;
  }
}

const TREE_EVENTS = ["init", "call", "return", "visit", "done"] as const;

function validateTreeStep(step: ExecutionStep<"tree">, position: number, add: AddIssue): void {
  const state: TreeState = step.state;
  const base = `steps.${position}`;
  const byId = new Map<string, TreeState["nodes"][number]>();
  for (const node of state.nodes) {
    if (byId.has(node.id)) add(position, `${base}.state.nodes`, `duplicate node id "${node.id}"`);
    byId.set(node.id, node);
  }
  const parents = new Map<string, number>();
  for (const node of state.nodes) {
    for (const child of [node.left, node.right]) {
      if (child === null) continue;
      if (!byId.has(child)) add(position, `${base}.state.nodes`, `node "${node.id}" points to missing node "${child}"`);
      parents.set(child, (parents.get(child) ?? 0) + 1);
    }
  }
  for (const [id, count] of parents) {
    if (count > 1) add(position, `${base}.state.nodes`, `node "${id}" has more than one parent`);
  }
  if (state.root !== null) {
    if (!byId.has(state.root)) add(position, `${base}.state.root`, `root points to missing node "${state.root}"`);
    if (parents.has(state.root)) add(position, `${base}.state.root`, "the root cannot be a child of another node");
  }
  // Every node must be reachable from the root exactly once (this also rules out cycles).
  const reached = new Set<string>();
  const stack = state.root !== null ? [state.root] : [];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reached.has(id)) continue;
    reached.add(id);
    const node = byId.get(id);
    if (node) for (const child of [node.left, node.right]) if (child !== null) stack.push(child);
  }
  if (reached.size !== state.nodes.length) add(position, `${base}.state.nodes`, "every node must be reachable from the root");

  const known = (id: string | null, path: string) => {
    if (id !== null && !byId.has(id)) add(position, path, `references missing node "${id}"`);
  };
  known(state.current, `${base}.state.current`);
  state.callStack.forEach((id, i) => known(id, `${base}.state.callStack.${i}`));

  const checkRef = (ref: ElementRef, path: string) => {
    if (ref.kind !== "node") add(position, path, "tree traces may only reference nodes by id");
    else known(ref.id, path);
  };
  step.changed.forEach((ref, i) => checkRef(ref, `${base}.changed.${i}`));
  step.highlights.forEach((h, i) => checkRef(h.target, `${base}.highlights.${i}.target`));

  const event = step.event;
  if (!(TREE_EVENTS as readonly string[]).includes(event.type)) {
    add(position, `${base}.event.type`, `a tree trace cannot use the "${event.type}" event`);
  }
  const top = state.callStack.length > 0 ? state.callStack[state.callStack.length - 1] : undefined;
  switch (event.type) {
    case "call":
      known(event.node, `${base}.event.node`);
      if (state.callStack.length === 0 || top !== event.node) {
        add(position, `${base}.event.node`, "a call must be on top of the call stack");
      }
      break;
    case "return":
      known(event.node, `${base}.event.node`);
      break;
    case "visit":
      checkRef(event.element, `${base}.event.element`);
      if (event.element.kind === "node") {
        const value = byId.get(event.element.id)?.value;
        if (value === undefined || state.output[state.output.length - 1] !== value) {
          add(position, `${base}.event.element`, "a visited node's value must be the last item of the output");
        }
      }
      break;
    default:
      break;
  }
}

function hasCycle(state: LinkedListState): boolean {
  const nextOf = new Map(state.nodes.map((n) => [n.id, n.next] as const));
  for (const start of nextOf.keys()) {
    const seen = new Set<string>();
    let current: string | null | undefined = start;
    while (current) {
      if (seen.has(current)) return true;
      seen.add(current);
      current = nextOf.get(current);
    }
  }
  return false;
}

const GRAPH_EVENTS = ["init", "compare", "assign", "visit", "enqueue", "dequeue", "push", "pop", "call", "return", "found", "notFound", "done"] as const;

function validateGraphStep(step: ExecutionStep<"graph">, position: number, add: AddIssue): void {
  const state: GraphState = step.state;
  const base = `steps.${position}`;
  const ids = new Set<string>();
  for (const node of state.nodes) {
    if (ids.has(node.id)) add(position, `${base}.state.nodes`, `duplicate node id "${node.id}"`);
    ids.add(node.id);
  }
  const known = (id: string | null, path: string) => {
    if (id !== null && !ids.has(id)) add(position, path, `references missing node "${id}"`);
  };
  const seenEdges = new Set<string>();
  state.edges.forEach((edge, i) => {
    known(edge.from, `${base}.state.edges.${i}.from`);
    known(edge.to, `${base}.state.edges.${i}.to`);
    if (edge.from === edge.to) add(position, `${base}.state.edges.${i}`, "self-loops are not drawn");
    const key = state.directed || edge.from < edge.to ? `${edge.from}>${edge.to}` : `${edge.to}>${edge.from}`;
    if (seenEdges.has(key)) add(position, `${base}.state.edges.${i}`, "duplicate edge");
    seenEdges.add(key);
  });
  known(state.current, `${base}.state.current`);
  if (state.activeEdge) {
    known(state.activeEdge.from, `${base}.state.activeEdge.from`);
    known(state.activeEdge.to, `${base}.state.activeEdge.to`);
    const exists = state.edges.some((e) => (e.from === state.activeEdge!.from && e.to === state.activeEdge!.to) || (!state.directed && e.from === state.activeEdge!.to && e.to === state.activeEdge!.from));
    if (!exists) add(position, `${base}.state.activeEdge`, "the active edge is not an edge of the graph");
  }
  state.frontier.forEach((id, i) => known(id, `${base}.state.frontier.${i}`));
  state.visited.forEach((id, i) => known(id, `${base}.state.visited.${i}`));
  for (const id of Object.keys(state.marks)) known(id, `${base}.state.marks.${id}`);

  const checkRef = (ref: ElementRef, path: string) => {
    if (ref.kind !== "node") add(position, path, "graph traces may only reference vertices by id");
    else known(ref.id, path);
  };
  step.changed.forEach((ref, i) => checkRef(ref, `${base}.changed.${i}`));
  step.highlights.forEach((h, i) => checkRef(h.target, `${base}.highlights.${i}.target`));

  const event = step.event;
  if (!(GRAPH_EVENTS as readonly string[]).includes(event.type)) {
    add(position, `${base}.event.type`, `a graph trace cannot use the "${event.type}" event`);
  }
  switch (event.type) {
    case "compare":
      checkRef(event.a, `${base}.event.a`);
      checkRef(event.b, `${base}.event.b`);
      break;
    case "assign":
      checkRef(event.target, `${base}.event.target`);
      break;
    case "visit":
    case "enqueue":
    case "dequeue":
    case "push":
    case "pop":
    case "found":
      checkRef(event.element, `${base}.event.element`);
      break;
    case "call":
    case "return":
      known(event.node, `${base}.event.node`);
      break;
    default:
      break;
  }
}

function validateGridStep(step: ExecutionStep<"grid">, position: number, add: AddIssue): void {
  const state = step.state;
  const base = `steps.${position}`;
  if (state.cells.length !== state.rows * state.cols) {
    add(position, `${base}.state.cells`, `grid has ${state.cells.length} cells but rows x cols is ${state.rows * state.cols}`);
  }
  if (state.rowLabels && state.rowLabels.length !== state.rows) add(position, `${base}.state.rowLabels`, `expected ${state.rows} row labels`);
  if (state.colLabels && state.colLabels.length !== state.cols) add(position, `${base}.state.colLabels`, `expected ${state.cols} column labels`);
  const size = state.cells.length;
  const checkRef = (ref: ElementRef, path: string) => {
    if (ref.kind !== "index") add(position, path, "grid traces may only reference cells by row-major index");
    else if (ref.index >= size) add(position, path, `index ${ref.index} is outside the grid (size ${size})`);
  };
  step.changed.forEach((ref, i) => checkRef(ref, `${base}.changed.${i}`));
  step.highlights.forEach((h, i) => checkRef(h.target, `${base}.highlights.${i}.target`));
  const event = step.event;
  switch (event.type) {
    case "compare":
    case "swap":
      checkRef(event.a, `${base}.event.a`);
      checkRef(event.b, `${base}.event.b`);
      break;
    case "assign":
      checkRef(event.target, `${base}.event.target`);
      break;
    case "visit":
    case "found":
      checkRef(event.element, `${base}.event.element`);
      break;
    default:
      break;
  }
}
