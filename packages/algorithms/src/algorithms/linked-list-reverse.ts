import { nodeRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { fmtList, hl, ListModel } from "./list-common";

export const ID = "linked-list-reverse";
export interface ListInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<ListInput> {
  return parseArrayWithFields(raw, limits, { noun: "list" }) as InputResult<ListInput>;
}

export function run(input: ListInput, limits: LimitProfile): ExecutionTrace {
  const L = new ListModel(input.values);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "linkedList", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  let prev: string | null = null;
  let current: string | null = L.head;
  let next: string | null = null;
  const ptrs = () => ({ prev, current, next });
  const marks = (): Highlight[] => [
    ...(prev ? [hl(prev, "sorted", "prev")] : []),
    ...(current ? [hl(current, "active", "current")] : []),
    ...(next ? [hl(next, "pointer", "next")] : []),
  ];
  const val = (id: string | null) => (id === null ? null : L.value(id));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Reverse ${fmtList(input.values)} by turning every next pointer around, one node at a time.`,
    variables: {}, state: L.state(), highlights: L.head ? [hl(L.head, "pointer", "head")] : [],
  });
  b.step({
    event: { type: "movePointer", pointer: "prev", to: null }, anchor: "init-prev",
    explanation: "prev starts as null: it will point at the part of the list that is already reversed. The first node will end up pointing at null.",
    variables: { prev: null }, state: L.state(ptrs()), highlights: [],
  });
  b.step({
    event: { type: "movePointer", pointer: "current", to: current ? nodeRef(current) : null }, anchor: "init-current",
    explanation: current ? `current starts at the head (${L.value(current)}).` : "The list is empty, so current is null and there is nothing to reverse.",
    variables: { prev: null, current: val(current) }, state: L.state(ptrs()), highlights: marks(),
  });
  while (current !== null) {
    b.step({
      event: { type: "visit", element: nodeRef(current) }, anchor: "loop",
      explanation: `current is not null, so the node holding ${L.value(current)} still needs its pointer reversed.`,
      variables: { prev: val(prev), current: val(current) }, state: L.state(ptrs()), highlights: marks(),
    });
    next = L.next(current);
    b.step({
      event: next ? { type: "movePointer", pointer: "next", to: nodeRef(next) } : { type: "movePointer", pointer: "next", to: null }, anchor: "save-next",
      explanation: next ? `Remember the next node (${L.value(next)}) in a variable, because the link is about to be overwritten.` : "There is no next node; remember null.",
      variables: { prev: val(prev), current: val(current), next: val(next) }, state: L.state(ptrs()), highlights: marks(),
    });
    L.node(current).next = prev;
    b.step({
      event: { type: "link", from: current, to: prev }, anchor: "reverse-link",
      explanation: prev ? `Point ${L.value(current)}'s next backwards, at ${L.value(prev)}.` : `Point ${L.value(current)}'s next at null: it is now the end of the reversed part.`,
      variables: { prev: val(prev), current: val(current), next: val(next) }, state: L.state(ptrs()), changed: [nodeRef(current)], highlights: marks(),
    });
    prev = current;
    b.step({
      event: { type: "movePointer", pointer: "prev", to: nodeRef(prev) }, anchor: "move-prev",
      explanation: `Move prev up to ${L.value(prev)}: it is now the front of the reversed part.`,
      variables: { prev: val(prev), current: val(current), next: val(next) }, state: L.state(ptrs()), highlights: marks(),
    });
    current = next;
    next = null;
    b.step({
      event: { type: "movePointer", pointer: "current", to: current ? nodeRef(current) : null }, anchor: "move-current",
      explanation: current ? `Move current to the saved next node, ${L.value(current)}.` : "current becomes null: every node has been reversed.",
      variables: { prev: val(prev), current: val(current) }, state: L.state(ptrs()), highlights: marks(),
    });
  }
  L.head = prev;
  b.step({
    event: { type: "movePointer", pointer: "head", to: prev ? nodeRef(prev) : null }, anchor: "finish",
    explanation: `Return prev as the new head. The list is now ${fmtList(L.values())}.`,
    variables: { prev: val(prev) }, state: L.state(), highlights: prev ? [hl(prev, "found", "head")] : [],
  });
  return b.build({ time: "O(n)", space: "O(1)", result: L.values() });
}

export const linkedListReverse: AlgorithmDefinition<ListInput> = { id: ID, parseInput, run };
