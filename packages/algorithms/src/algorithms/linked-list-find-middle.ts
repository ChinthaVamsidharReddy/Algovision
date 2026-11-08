import { nodeRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { fmtList, hl, ListModel } from "./list-common";

export const ID = "linked-list-find-middle";
export interface MiddleInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<MiddleInput> {
  return parseArrayWithFields(raw, limits, { noun: "list", minLength: 1, minLengthMessage: "Enter at least one node." }) as InputResult<MiddleInput>;
}

export function run(input: MiddleInput, limits: LimitProfile): ExecutionTrace {
  const L = new ListModel(input.values);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "linkedList", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  let slow = L.head!;
  let fast: string | null = L.head;
  const ptrs = () => ({ slow, fast });
  const marks = (): Highlight[] => [hl(slow, "active", "slow"), ...(fast && fast !== slow ? [hl(fast, "pointer", "fast")] : [])];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the middle of ${fmtList(input.values)} in one pass. slow moves one node at a time and fast moves two, so when fast reaches the end, slow is at the middle.`,
    variables: {}, state: L.state(), highlights: [],
  });
  b.step({
    event: { type: "movePointer", pointer: "slow", to: nodeRef(slow) }, anchor: "init-pointers",
    explanation: `Both pointers start at the head (${L.value(slow)}).`,
    variables: { slow: L.value(slow), fast: L.value(fast!) }, state: L.state(ptrs()), highlights: marks(),
  });
  for (;;) {
    const go = fast !== null && L.next(fast) !== null;
    b.step({
      event: { type: "visit", element: nodeRef(fast ?? slow) }, anchor: "loop",
      explanation: fast === null ? "fast is null, so it ran off the end. Stop." : go ? "fast and fast.next both exist, so fast can jump two nodes. Keep going." : "fast.next is null, so fast is on the last node. Stop.",
      variables: { slow: L.value(slow), fast: fast ? L.value(fast) : null }, state: L.state(ptrs()), highlights: marks(),
    });
    if (!go) break;
    slow = L.next(slow)!;
    b.step({
      event: { type: "movePointer", pointer: "slow", to: nodeRef(slow) }, anchor: "move-slow",
      explanation: `Move slow one node: ${L.value(slow)}.`,
      variables: { slow: L.value(slow), fast: L.value(fast!) }, state: L.state(ptrs()), highlights: marks(),
    });
    fast = L.next(L.next(fast!)!);
    b.step({
      event: { type: "movePointer", pointer: "fast", to: fast ? nodeRef(fast) : null }, anchor: "move-fast",
      explanation: fast ? `Move fast two nodes: ${L.value(fast)}.` : "Move fast two nodes: it falls off the end (null).",
      variables: { slow: L.value(slow), fast: fast ? L.value(fast) : null }, state: L.state(ptrs()), highlights: marks(),
    });
  }
  b.step({
    event: { type: "found", element: nodeRef(slow) }, anchor: "finish",
    explanation: `slow is on the middle node, which holds ${L.value(slow)}.${input.values.length % 2 === 0 ? " With an even number of nodes this is the second of the two middle nodes." : ""}`,
    variables: { slow: L.value(slow) }, state: L.state({ slow }), highlights: [hl(slow, "found", "middle")],
  });
  return b.build({ time: "O(n)", space: "O(1)", result: L.value(slow) });
}

export const linkedListFindMiddle: AlgorithmDefinition<MiddleInput> = { id: ID, parseInput, run };
