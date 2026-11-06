import { z } from "zod";
import { nodeRef, type ExecutionTrace, type Highlight, type LinkedListNode } from "@algovision/trace-schema";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import type { AlgorithmDefinition } from "../definition";

export const ID = "linked-list-insert-head";

export interface InsertHeadInput {
  readonly values: readonly number[];
  readonly value: number;
}

function inputSchema(limits: LimitProfile) {
  const max = limits.maxAbsValue;
  const whole = (what: string) =>
    z
      .number({ error: `${what} must be a whole number.` })
      .int(`${what} must be a whole number.`)
      .min(-max, `${what} must be between -${max} and ${max}.`)
      .max(max, `${what} must be between -${max} and ${max}.`);
  return z.strictObject({
    values: z
      .array(whole("Each list value"), { error: "List values must be a list of numbers." })
      .max(limits.maxListNodes, `The list can have at most ${limits.maxListNodes} nodes.`),
    value: whole("The value to insert"),
  });
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<InsertHeadInput> {
  const parsed = inputSchema(limits).safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };
  const errors: FieldError[] = parsed.error.issues.map((issue) => ({
    field: String(issue.path[0] ?? "input"),
    message: issue.message,
  }));
  return { ok: false, errors };
}

const fmt = (values: readonly number[]): string => (values.length === 0 ? "empty" : `[${values.join(", ")}]`);

export function run(input: InsertHeadInput, limits: LimitProfile): ExecutionTrace {
  const nodes: LinkedListNode[] = input.values.map((value, i) => ({
    id: `n${i + 1}`,
    value,
    next: i + 1 < input.values.length ? `n${i + 2}` : null,
  }));
  let head: string | null = nodes[0]?.id ?? null;
  const oldHead = head;
  const oldHeadValue = nodes[0]?.value ?? null;
  const newId = `n${nodes.length + 1}`;

  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "linkedList",
    input: { values: [...input.values], value: input.value },
    maxSteps: limits.maxSteps,
  });
  const state = (pointers: Record<string, string | null>) => ({
    kind: "linkedList" as const,
    nodes: nodes.map((n) => ({ ...n })),
    head,
    pointers,
  });
  const headHighlight = (target: string, label: string): Highlight => ({ target: nodeRef(target), role: "active", label });

  // 0. Starting point.
  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation:
      `The list is ${fmt(input.values)}. We will insert ${input.value} at the beginning, so it becomes the new head.`,
    variables: { value: input.value, head: oldHeadValue },
    state: state({}),
    highlights: oldHead ? [headHighlight(oldHead, "head")] : [],
  });

  // 1. Create a detached node.
  nodes.push({ id: newId, value: input.value, next: null });
  builder.step({
    event: { type: "insertNode", node: newId },
    anchor: "create-node",
    explanation: `Create a new node holding ${input.value}. It is not connected to the list yet.`,
    variables: { value: input.value, head: oldHeadValue, "node.value": input.value },
    state: state({ node: newId }),
    changed: [nodeRef(newId)],
    highlights: [{ target: nodeRef(newId), role: "created", label: "new" }],
    motion: "appear",
  });

  // 2. Point the new node at the old head.
  const newNode = nodes[nodes.length - 1]!;
  newNode.next = oldHead;
  builder.step({
    event: { type: "link", from: newId, to: oldHead },
    anchor: "link-next",
    explanation:
      oldHead === null
        ? "The list is empty, so the new node's next stays null."
        : `Point the new node's next at the current head (${oldHeadValue}), so the whole old list hangs off the new node.`,
    variables: { value: input.value, head: oldHeadValue, "node.value": input.value, "node.next": oldHeadValue },
    state: state({ node: newId }),
    changed: [nodeRef(newId)],
    highlights: [
      { target: nodeRef(newId), role: "active", label: "new" },
      ...(oldHead ? [{ target: nodeRef(oldHead), role: "pointer" as const, label: "old head" }] : []),
    ],
  });

  // 3. Move head.
  head = newId;
  builder.step({
    event: { type: "movePointer", pointer: "head", to: nodeRef(newId) },
    anchor: "move-head",
    explanation: "Move head to the new node. It is now the first node of the list.",
    variables: { value: input.value, head: input.value, "node.value": input.value, "node.next": oldHeadValue },
    state: state({ node: newId }),
    changed: [nodeRef(newId)],
    highlights: [headHighlight(newId, "head")],
  });

  // 4. Return; the local variable goes out of scope.
  const result = [input.value, ...input.values];
  builder.step({
    event: { type: "done" },
    anchor: "finish",
    explanation: `Return. The list is now ${fmt(result)}. This took the same few steps no matter how long the list was.`,
    variables: { value: input.value, head: input.value },
    state: state({}),
    highlights: [{ target: nodeRef(newId), role: "created", label: "head" }],
  });

  return builder.build({ time: "O(1)", space: "O(1)", result });
}

export const linkedListInsertHead: AlgorithmDefinition<InsertHeadInput> = { id: ID, parseInput, run };
