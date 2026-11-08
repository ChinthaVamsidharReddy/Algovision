import { nodeRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { fmtList, hl, ListModel } from "./list-common";

export const ID = "linked-list-search";
export interface ListSearchInput { readonly values: readonly number[]; readonly value: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<ListSearchInput> {
  return parseArrayWithFields(raw, limits, { noun: "list", fields: [{ name: "value", label: "Value to find" }] }) as InputResult<ListSearchInput>;
}

export function run(input: ListSearchInput, limits: LimitProfile): ExecutionTrace {
  const { value } = input;
  const L = new ListModel(input.values);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "linkedList", input: { values: [...input.values], value }, maxSteps: limits.maxSteps });
  const lead = (): Highlight[] => (L.head ? [hl(L.head, "pointer", "head")] : []);
  let index = 0;
  let current: string | null = L.head;

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Search ${fmtList(input.values)} for ${value}. Walk from the head, one node at a time, checking each value.`,
    variables: { value }, state: L.state(), highlights: lead(),
  });
  b.step({
    event: { type: "init" }, anchor: "init-index",
    explanation: "index counts how many nodes we have passed. It starts at 0.", variables: { value, index }, state: L.state(), highlights: lead(),
  });
  b.step({
    event: { type: "movePointer", pointer: "current", to: current ? nodeRef(current) : null }, anchor: "init-current",
    explanation: current ? `Start current at the head (${L.value(current)}).` : "The list is empty, so current starts as null.",
    variables: { value, index, current: current ? L.value(current) : null }, state: L.state({ current }), highlights: current ? [hl(current, "active", "current")] : [],
  });
  while (current !== null) {
    b.step({
      event: { type: "visit", element: nodeRef(current) }, anchor: "loop",
      explanation: `current is not null, so look at the node holding ${L.value(current)} (index ${index}).`,
      variables: { value, index, current: L.value(current) }, state: L.state({ current }), highlights: [hl(current, "active", "current")],
    });
    const hit = L.value(current) === value;
    b.step({
      event: { type: "visit", element: nodeRef(current) }, anchor: "compare",
      explanation: hit ? `${L.value(current)} equals ${value}.` : `${L.value(current)} is not ${value}.`,
      variables: { value, index, current: L.value(current) }, state: L.state({ current }), highlights: [hl(current, "compared", "current")],
    });
    if (hit) {
      b.step({
        event: { type: "found", element: nodeRef(current) }, anchor: "found",
        explanation: `Found ${value} at index ${index}.`,
        variables: { value, index }, state: L.state({ current }), highlights: [hl(current, "found", "found")],
      });
      return b.build({ time: "O(n)", space: "O(1)", result: index });
    }
    current = L.next(current);
    index++;
    b.step({
      event: { type: "movePointer", pointer: "current", to: current ? nodeRef(current) : null }, anchor: "advance",
      explanation: current ? `Move current to the next node and increase index to ${index}.` : `There is no next node. current becomes null and index is ${index}.`,
      variables: { value, index, current: current ? L.value(current) : null }, state: L.state({ current }), highlights: current ? [hl(current, "active", "current")] : [],
    });
  }
  b.step({
    event: { type: "notFound" }, anchor: "not-found",
    explanation: `We reached the end of the list without finding ${value}, so the answer is -1.`,
    variables: { value, index }, state: L.state(), highlights: [],
  });
  return b.build({ time: "O(n)", space: "O(1)", result: -1 });
}

export const linkedListSearch: AlgorithmDefinition<ListSearchInput> = { id: ID, parseInput, run };
