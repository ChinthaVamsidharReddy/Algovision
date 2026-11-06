import { nodeRef, type ExecutionTrace, type Highlight, type LinkedListNode } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseInput, type InsertHeadInput } from "./linked-list-insert-head";

export const ID = "linked-list-insert-tail";
export { parseInput };

const fmt = (values: readonly number[]): string => (values.length === 0 ? "empty" : `[${values.join(", ")}]`);

export function run(input: InsertHeadInput, limits: LimitProfile): ExecutionTrace {
  const nodes: LinkedListNode[] = input.values.map((value, i) => ({
    id: `n${i + 1}`,
    value,
    next: i + 1 < input.values.length ? `n${i + 2}` : null,
  }));
  let head: string | null = nodes[0]?.id ?? null;
  const newId = `n${nodes.length + 1}`;
  const valueOf = (id: string) => nodes.find((n) => n.id === id)!.value;

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
  const created = (): Highlight => ({ target: nodeRef(newId), role: "created", label: "new" });

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation: `The list is ${fmt(input.values)}. We will insert ${input.value} at the end, so it becomes the new last node.`,
    variables: { value: input.value },
    state: state({}),
    highlights: head ? [{ target: nodeRef(head), role: "active", label: "head" }] : [],
  });

  nodes.push({ id: newId, value: input.value, next: null });
  builder.step({
    event: { type: "insertNode", node: newId },
    anchor: "create-node",
    explanation: `Create a new node holding ${input.value}. It is not connected to the list yet.`,
    variables: { value: input.value },
    state: state({ node: newId }),
    changed: [nodeRef(newId)],
    highlights: [created(), ...(head ? [{ target: nodeRef(head), role: "pointer" as const, label: "head" }] : [])],
    motion: "appear",
  });

  const finish = (result: number[]) => {
    builder.step({
      event: { type: "done" },
      anchor: "finish",
      explanation: `Return. The list is now ${fmt(result)}. ${result.length > 1 ? `We walked past ${result.length - 1} node${result.length === 2 ? "" : "s"} to reach the end, so the work grows with the list length.` : ""}`.trim(),
      variables: { value: input.value },
      state: state({}),
      highlights: [{ target: nodeRef(newId), role: "created", label: "tail" }],
    });
    return builder.build({ time: "O(n)", space: "O(1)", result });
  };

  if (head === null) {
    builder.step({
      event: { type: "movePointer", pointer: "head", to: null },
      anchor: "check-empty",
      explanation: "head is null, so the list is empty and the new node will be the whole list.",
      variables: { value: input.value, head: null },
      state: state({ node: newId }),
      highlights: [created()],
    });
    head = newId;
    builder.step({
      event: { type: "movePointer", pointer: "head", to: nodeRef(newId) },
      anchor: "set-head",
      explanation: "Set head to the new node. It is the first and only node.",
      variables: { value: input.value, head: input.value },
      state: state({ node: newId }),
      changed: [nodeRef(newId)],
      highlights: [{ target: nodeRef(newId), role: "active", label: "head" }],
    });
    return finish([input.value]);
  }

  builder.step({
    event: { type: "visit", element: nodeRef(head) },
    anchor: "check-empty",
    explanation: "head is not null, so the list has nodes. We must walk to the last one.",
    variables: { value: input.value, head: valueOf(head) },
    state: state({ node: newId }),
    highlights: [created(), { target: nodeRef(head), role: "active", label: "head" }],
  });

  let current: string = head;
  builder.step({
    event: { type: "movePointer", pointer: "current", to: nodeRef(current) },
    anchor: "init-current",
    explanation: `Start current at the head (${valueOf(current)}).`,
    variables: { value: input.value, current: valueOf(current) },
    state: state({ node: newId, current }),
    highlights: [created(), { target: nodeRef(current), role: "active", label: "current" }],
  });

  for (;;) {
    const next = nodes.find((n) => n.id === current)!.next;
    const hasNext = next !== null;
    builder.step({
      event: { type: "visit", element: nodeRef(current) },
      anchor: "loop",
      explanation: hasNext
        ? `${valueOf(current)} has a next node (${valueOf(next)}), so it is not the last one. Keep walking.`
        : `${valueOf(current)} has no next node, so it is the last node. Stop walking.`,
      variables: { value: input.value, current: valueOf(current) },
      state: state({ node: newId, current }),
      highlights: [created(), { target: nodeRef(current), role: "compared", label: "current" }],
    });
    if (next === null) break;
    current = next;
    builder.step({
      event: { type: "movePointer", pointer: "current", to: nodeRef(current) },
      anchor: "advance",
      explanation: `Move current forward to ${valueOf(current)}.`,
      variables: { value: input.value, current: valueOf(current) },
      state: state({ node: newId, current }),
      highlights: [created(), { target: nodeRef(current), role: "active", label: "current" }],
    });
  }

  nodes.find((n) => n.id === current)!.next = newId;
  builder.step({
    event: { type: "link", from: current, to: newId },
    anchor: "link-tail",
    explanation: `Point the last node's next at the new node. ${input.value} is now the end of the list.`,
    variables: { value: input.value, current: valueOf(current) },
    state: state({ node: newId, current }),
    changed: [nodeRef(current), nodeRef(newId)],
    highlights: [created(), { target: nodeRef(current), role: "active", label: "last" }],
  });
  return finish([...input.values, input.value]);
}

export const linkedListInsertTail: AlgorithmDefinition<InsertHeadInput> = { id: ID, parseInput, run };
