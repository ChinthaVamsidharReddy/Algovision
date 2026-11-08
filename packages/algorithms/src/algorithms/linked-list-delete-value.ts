import { nodeRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { fmtList, hl, ListModel } from "./list-common";

export const ID = "linked-list-delete-value";
export interface DeleteValueInput { readonly values: readonly number[]; readonly value: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<DeleteValueInput> {
  return parseArrayWithFields(raw, limits, { noun: "list", fields: [{ name: "value", label: "Value to delete" }] }) as InputResult<DeleteValueInput>;
}

export function run(input: DeleteValueInput, limits: LimitProfile): ExecutionTrace {
  const { value } = input;
  const L = new ListModel(input.values);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "linkedList", input: { values: [...input.values], value }, maxSteps: limits.maxSteps });

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Delete the first node holding ${value} from ${fmtList(input.values)}.`,
    variables: { value }, state: L.state(), highlights: L.head ? [hl(L.head, "pointer", "head")] : [],
  });
  b.step({
    event: { type: "init" }, anchor: "check-empty",
    explanation: L.head === null ? "head is null: the list is empty, so there is nothing to delete." : "The list has nodes, so continue.",
    variables: { value }, state: L.state(), highlights: [],
  });
  if (L.head === null) return b.build({ time: "O(n)", space: "O(1)", result: [] });
  const first = L.head;
  const headHit = L.value(first) === value;
  b.step({
    event: { type: "visit", element: nodeRef(first) }, anchor: "check-head",
    explanation: headHit ? `The head holds ${value}, so the head itself must go.` : `The head holds ${L.value(first)}, not ${value}, so look further along.`,
    variables: { value, head: L.value(first) }, state: L.state(), highlights: [hl(first, headHit ? "compared" : "pointer", "head")],
  });
  if (headHit) {
    L.head = L.next(first);
    b.step({
      event: { type: "movePointer", pointer: "head", to: L.head ? nodeRef(L.head) : null }, anchor: "delete-head",
      explanation: `Move head to the second node. The old head is no longer reachable, so it is deleted.`,
      variables: { value }, state: L.state(), highlights: [hl(first, "swapped", "removed"), ...(L.head ? [hl(L.head, "active", "head")] : [])],
    });
    L.remove(first);
    b.step({
      event: { type: "removeNode", node: first }, anchor: "finish",
      explanation: `The list is now ${fmtList(L.values())}.`,
      variables: { value }, state: L.state(), highlights: L.head ? [hl(L.head, "pointer", "head")] : [],
    });
    return b.build({ time: "O(n)", space: "O(1)", result: L.values() });
  }
  let prev = first;
  b.step({
    event: { type: "movePointer", pointer: "prev", to: nodeRef(prev) }, anchor: "init-prev",
    explanation: "prev starts at the head. We stop at the node just BEFORE the one to delete, because that node's next must be changed.",
    variables: { value, prev: L.value(prev) }, state: L.state({ prev }), highlights: [hl(prev, "active", "prev")],
  });
  for (;;) {
    const nxt = L.next(prev);
    const keepGoing = nxt !== null && L.value(nxt) !== value;
    b.step({
      event: { type: "visit", element: nodeRef(prev) }, anchor: "loop",
      explanation: nxt === null ? `prev has no next node, so we reached the end without finding ${value}.` : keepGoing ? `The node after prev holds ${L.value(nxt)}, not ${value}, so keep walking.` : `The node after prev holds ${value}. Stop here.`,
      variables: { value, prev: L.value(prev) }, state: L.state({ prev }), highlights: [hl(prev, "compared", "prev"), ...(nxt ? [hl(nxt, "compared")] : [])],
    });
    if (!keepGoing) break;
    prev = nxt!;
    b.step({
      event: { type: "movePointer", pointer: "prev", to: nodeRef(prev) }, anchor: "advance",
      explanation: `Move prev forward to ${L.value(prev)}.`,
      variables: { value, prev: L.value(prev) }, state: L.state({ prev }), highlights: [hl(prev, "active", "prev")],
    });
  }
  const target = L.next(prev);
  b.step({
    event: { type: "visit", element: nodeRef(prev) }, anchor: "check-found",
    explanation: target ? `prev.next is the node to delete (${value}).` : `prev.next is null, so ${value} is not in the list. Nothing to delete.`,
    variables: { value }, state: L.state({ prev }), highlights: [hl(prev, "compared", "prev"), ...(target ? [hl(target, "found")] : [])],
  });
  if (target) {
    L.node(prev).next = L.next(target);
    b.step({
      event: { type: "unlink", from: prev, to: L.next(target) }, anchor: "unlink",
      explanation: `Make prev.next skip the node holding ${value}: point it at the node after. The skipped node is now unreachable.`,
      variables: { value }, state: L.state({ prev }), changed: [nodeRef(prev)], highlights: [hl(prev, "active", "prev"), hl(target, "swapped", "removed")],
    });
    L.remove(target);
  }
  b.step({
    event: target ? { type: "removeNode", node: target } : { type: "done" }, anchor: "finish",
    explanation: `Done. The list is ${fmtList(L.values())}.`,
    variables: { value }, state: L.state(), highlights: L.head ? [hl(L.head, "pointer", "head")] : [],
  });
  return b.build({ time: "O(n)", space: "O(1)", result: L.values() });
}

export const linkedListDeleteValue: AlgorithmDefinition<DeleteValueInput> = { id: ID, parseInput, run };
