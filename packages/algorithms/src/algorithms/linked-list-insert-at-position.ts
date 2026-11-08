import { nodeRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { fmtList, hl, ListModel } from "./list-common";

export const ID = "linked-list-insert-at-position";
export interface InsertAtPositionInput { readonly values: readonly number[]; readonly position: number; readonly value: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<InsertAtPositionInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "list before insertion",
    maxLength: (l) => l.maxListNodes - 1,
    fields: [
      { name: "position", label: "Insert position", min: () => 0, max: (v) => v.length, rangeMessage: (v) => `Insert position must be between 0 and ${v.length}.` },
      { name: "value", label: "New value" },
    ],
  }) as InputResult<InsertAtPositionInput>;
}

export function run(input: InsertAtPositionInput, limits: LimitProfile): ExecutionTrace {
  const { position, value } = input;
  const L = new ListModel(input.values);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "linkedList", input: { values: [...input.values], position, value }, maxSteps: limits.maxSteps });

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Insert ${value} so that it ends up at position ${position} of ${fmtList(input.values)} (positions count from 0).`,
    variables: { position, value }, state: L.state(), highlights: L.head ? [hl(L.head, "pointer", "head")] : [],
  });
  const id = L.create(value);
  b.step({
    event: { type: "insertNode", node: id }, anchor: "create-node",
    explanation: `Create a new node holding ${value}. It is not connected to the list yet.`,
    variables: { position, value }, state: L.state({ node: id }), changed: [nodeRef(id)], highlights: [hl(id, "created", "new")], motion: "appear",
  });
  b.step({
    event: { type: "visit", element: nodeRef(id) }, anchor: "check-head",
    explanation: position === 0 ? "Position 0 means the new node becomes the head." : `Position ${position} is not 0, so we must find the node just before it.`,
    variables: { position, value }, state: L.state({ node: id }), highlights: [hl(id, "created", "new")],
  });
  if (position === 0) {
    L.node(id).next = L.head;
    L.head = id;
    b.step({
      event: { type: "link", from: id, to: L.next(id) }, anchor: "link-new-head",
      explanation: "Point the new node at the old head, then make it the head.",
      variables: { position, value }, state: L.state({ node: id }), changed: [nodeRef(id)], highlights: [hl(id, "created", "head")],
    });
    return finish();
  }
  let prev: string = L.head!;
  b.step({
    event: { type: "movePointer", pointer: "prev", to: nodeRef(prev) }, anchor: "init-prev",
    explanation: `prev starts at the head (${L.value(prev)}) and will walk ${position - 1} step${position === 2 ? "" : "s"} to reach the node before the insertion point.`,
    variables: { position, value, prev: L.value(prev) }, state: L.state({ prev, node: id }), highlights: [hl(id, "created", "new"), hl(prev, "active", "prev")],
  });
  for (let i = 0; i < position - 1; i++) {
    b.step({
      event: { type: "visit", element: nodeRef(prev) }, anchor: "walk-loop",
      explanation: `Step ${i + 1} of ${position - 1}: prev is not there yet.`,
      variables: { i, position, prev: L.value(prev) }, state: L.state({ prev, node: id }), highlights: [hl(id, "created", "new"), hl(prev, "compared", "prev")],
    });
    prev = L.next(prev)!;
    b.step({
      event: { type: "movePointer", pointer: "prev", to: nodeRef(prev) }, anchor: "advance",
      explanation: `Move prev to ${L.value(prev)}.`,
      variables: { i, position, prev: L.value(prev) }, state: L.state({ prev, node: id }), highlights: [hl(id, "created", "new"), hl(prev, "active", "prev")],
    });
  }
  L.node(id).next = L.next(prev);
  b.step({
    event: { type: "link", from: id, to: L.next(id) }, anchor: "link-new",
    explanation: L.next(id) ? `Point the new node at prev's next node (${L.value(L.next(id)!)}) so nothing after it is lost.` : "prev is the last node, so the new node's next stays null.",
    variables: { position, value }, state: L.state({ prev, node: id }), changed: [nodeRef(id)], highlights: [hl(id, "created", "new"), hl(prev, "active", "prev")],
  });
  L.node(prev).next = id;
  b.step({
    event: { type: "link", from: prev, to: id }, anchor: "link-prev",
    explanation: `Point prev at the new node. ${value} is now in the list.`,
    variables: { position, value }, state: L.state({ prev, node: id }), changed: [nodeRef(prev)], highlights: [hl(id, "created", "new"), hl(prev, "active", "prev")],
  });
  return finish();

  function finish(): ExecutionTrace {
    b.step({
      event: { type: "done" }, anchor: "finish",
      explanation: `Done. The list is ${fmtList(L.values())}.`, variables: { position, value }, state: L.state(), highlights: [hl(id, "created", "new")],
    });
    return b.build({ time: "O(n)", space: "O(1)", result: L.values() });
  }
}

export const linkedListInsertAtPosition: AlgorithmDefinition<InsertAtPositionInput> = { id: ID, parseInput, run };
