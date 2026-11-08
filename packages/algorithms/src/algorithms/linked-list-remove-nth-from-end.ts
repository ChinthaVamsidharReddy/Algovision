import { nodeRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { fmtList, hl, ListModel } from "./list-common";

export const ID = "linked-list-remove-nth-from-end";
export interface RemoveNthInput { readonly values: readonly number[]; readonly n: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<RemoveNthInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "list", minLength: 1, minLengthMessage: "Enter at least one node.",
    fields: [{ name: "n", label: "Position from the end (n)", min: () => 1, max: (v) => Math.max(1, v.length), rangeMessage: (v) => `Position from the end (n) must be between 1 and ${v.length}.` }],
  }) as InputResult<RemoveNthInput>;
}

export function run(input: RemoveNthInput, limits: LimitProfile): ExecutionTrace {
  const { n } = input;
  const L = new ListModel(input.values);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "linkedList", input: { values: [...input.values], n }, maxSteps: limits.maxSteps });
  let fast: string | null = L.head;
  let slow: string | null = L.head;
  const ptrs = () => ({ slow, fast });
  const marks = (): Highlight[] => [...(slow ? [hl(slow, "active", "slow")] : []), ...(fast && fast !== slow ? [hl(fast, "pointer", "fast")] : [])];
  const v = (id: string | null) => (id === null ? null : L.value(id));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Remove the ${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} node from the END of ${fmtList(input.values)} in one pass. Give fast an n-node head start; then when fast reaches the last node, slow is just before the node to remove.`,
    variables: { n }, state: L.state(), highlights: [],
  });
  b.step({
    event: { type: "movePointer", pointer: "fast", to: nodeRef(fast!) }, anchor: "init-pointers",
    explanation: `fast and slow both start at the head (${L.value(fast!)}).`,
    variables: { n, slow: v(slow), fast: v(fast) }, state: L.state(ptrs()), highlights: marks(),
  });
  for (let i = 0; i < n; i++) {
    b.step({
      event: { type: "init" }, anchor: "gap-loop",
      explanation: `Advance fast to build a gap: step ${i + 1} of ${n}.`,
      variables: { n, i, fast: v(fast) }, state: L.state(ptrs()), highlights: marks(),
    });
    fast = L.next(fast!);
    b.step({
      event: { type: "movePointer", pointer: "fast", to: fast ? nodeRef(fast) : null }, anchor: "gap-advance",
      explanation: fast ? `fast moves to ${L.value(fast)}.` : "fast moves past the end (null): it is now exactly n nodes ahead of slow.",
      variables: { n, i, fast: v(fast) }, state: L.state(ptrs()), highlights: marks(),
    });
  }
  const removesHead = fast === null;
  b.step({
    event: { type: "visit", element: nodeRef(slow!) }, anchor: "check-head",
    explanation: removesHead ? "fast is null: it walked off the end, so the node to remove is the head itself." : "fast is not null, so the node to remove is further along. Walk both pointers together.",
    variables: { n, slow: v(slow), fast: v(fast) }, state: L.state(ptrs()), highlights: marks(),
  });
  if (removesHead) {
    const old = L.head!;
    L.head = L.next(old);
    b.step({
      event: { type: "movePointer", pointer: "head", to: L.head ? nodeRef(L.head) : null }, anchor: "remove-head",
      explanation: "Return head.next: the old head is dropped.",
      variables: { n }, state: L.state(), highlights: [hl(old, "swapped", "removed"), ...(L.head ? [hl(L.head, "active", "head")] : [])],
    });
    L.remove(old);
    b.step({
      event: { type: "removeNode", node: old }, anchor: "finish",
      explanation: `Done. The list is ${fmtList(L.values())}.`, variables: { n }, state: L.state(), highlights: [],
    });
    return b.build({ time: "O(n)", space: "O(1)", result: L.values() });
  }
  for (;;) {
    const more = L.next(fast!) !== null;
    b.step({
      event: { type: "visit", element: nodeRef(fast!) }, anchor: "loop",
      explanation: more ? "fast.next exists, so fast is not on the last node yet." : "fast.next is null: fast is on the last node. Stop.",
      variables: { slow: v(slow), fast: v(fast) }, state: L.state(ptrs()), highlights: marks(),
    });
    if (!more) break;
    fast = L.next(fast!);
    b.step({
      event: { type: "movePointer", pointer: "fast", to: nodeRef(fast!) }, anchor: "move-fast",
      explanation: `fast moves to ${L.value(fast!)}.`, variables: { slow: v(slow), fast: v(fast) }, state: L.state(ptrs()), highlights: marks(),
    });
    slow = L.next(slow!);
    b.step({
      event: { type: "movePointer", pointer: "slow", to: nodeRef(slow!) }, anchor: "move-slow",
      explanation: `slow moves to ${L.value(slow!)}.`, variables: { slow: v(slow), fast: v(fast) }, state: L.state(ptrs()), highlights: marks(),
    });
  }
  const dead = L.next(slow!)!;
  L.node(slow!).next = L.next(dead);
  b.step({
    event: { type: "unlink", from: slow!, to: L.next(dead) }, anchor: "unlink",
    explanation: `slow is just before the node to remove (${L.value(dead)}). Point slow.next past it.`,
    variables: { slow: v(slow) }, state: L.state({ slow }), changed: [nodeRef(slow!)], highlights: [hl(slow!, "active", "slow"), hl(dead, "swapped", "removed")],
  });
  L.remove(dead);
  b.step({
    event: { type: "removeNode", node: dead }, anchor: "finish",
    explanation: `Done. The list is ${fmtList(L.values())}.`, variables: {}, state: L.state(), highlights: L.head ? [hl(L.head, "pointer", "head")] : [],
  });
  return b.build({ time: "O(n)", space: "O(1)", result: L.values() });
}

export const linkedListRemoveNthFromEnd: AlgorithmDefinition<RemoveNthInput> = { id: ID, parseInput, run };
