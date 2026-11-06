import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "insert-at-index";
export interface InsertAtIndexInput { readonly values: readonly number[]; readonly index: number; readonly value: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<InsertAtIndexInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "array before insertion",
    maxLength: (l) => l.maxArrayLength - 1,
    fields: [
      { name: "index", label: "Insert position", min: () => 0, max: (v) => v.length, rangeMessage: (v) => `Insert position must be between 0 and ${v.length}.` },
      { name: "value", label: "New value" },
    ],
  }) as InputResult<InsertAtIndexInput>;
}

export function run(input: InsertAtIndexInput, limits: LimitProfile): ExecutionTrace {
  const { index, value } = input;
  const n = input.values.length;
  const arr = [...input.values, 0]; // the spare slot at the end
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values], index, value }, maxSteps: limits.maxSteps });

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Insert ${value} at index ${index} of ${fmt(input.values)}. The array has one spare slot at the end (index ${n}), so everything from index ${index} onward can slide one place right.`,
    variables: { n, index, value }, state: snapshot(arr, {}), highlights: [cell(n, "created", "spare")],
  });
  for (let i = n; i > index; i--) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "shift-loop",
      explanation: `Work from the right. Index ${i} is the next slot to fill, taking the value from index ${i - 1}.`,
      variables: { n, index, value, i }, state: snapshot(arr, { i }), highlights: [cell(i - 1, "compared"), cell(i, "active", "i")],
    });
    arr[i] = arr[i - 1]!;
    b.step({
      event: { type: "assign", target: indexRef(i), value: arr[i]! }, anchor: "shift",
      explanation: `Copy ${arr[i]} from index ${i - 1} to index ${i}.`,
      variables: { n, index, value, i }, state: snapshot(arr, { i }), changed: [indexRef(i)],
      highlights: [cell(i - 1, "compared"), cell(i, "swapped")], motion: "slide",
    });
  }
  arr[index] = value;
  b.step({
    event: { type: "assign", target: indexRef(index), value }, anchor: "place",
    explanation: index === n ? `Nothing needed to move. Write ${value} into the spare slot at index ${index}.` : `The gap is at index ${index}. Write ${value} into it.`,
    variables: { n, index, value }, state: snapshot(arr, { index }), changed: [indexRef(index)],
    highlights: [cell(index, "found", "new")], motion: "appear",
  });
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `Done. The array now has ${n + 1} values: ${fmt(arr)}.`,
    variables: { n: n + 1 }, state: snapshot(arr, {}), highlights: [cell(index, "found", "new")],
  });
  return b.build({ time: "O(n)", space: "O(1)", result: arr });
}

export const insertAtIndex: AlgorithmDefinition<InsertAtIndexInput> = { id: ID, parseInput, run };
