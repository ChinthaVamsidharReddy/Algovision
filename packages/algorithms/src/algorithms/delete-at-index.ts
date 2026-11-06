import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "delete-at-index";
export interface DeleteAtIndexInput { readonly values: readonly number[]; readonly index: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<DeleteAtIndexInput> {
  return parseArrayWithFields(raw, limits, {
    minLength: 1,
    minLengthMessage: "Enter at least one value to delete from.",
    fields: [
      { name: "index", label: "Position to delete", min: () => 0, max: (v) => Math.max(0, v.length - 1), rangeMessage: (v) => `Position to delete must be between 0 and ${Math.max(0, v.length - 1)}.` },
    ],
  }) as InputResult<DeleteAtIndexInput>;
}

export function run(input: DeleteAtIndexInput, limits: LimitProfile): ExecutionTrace {
  const { index } = input;
  const arr = [...input.values];
  const n = arr.length;
  const removed = arr[index]!;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values], index }, maxSteps: limits.maxSteps });

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Delete the value ${removed} at index ${index} of ${fmt(arr)}. Every value to its right slides one place left, and the array gets one shorter.`,
    variables: { n, index }, state: snapshot(arr, {}), highlights: [cell(index, "compared", "delete")],
  });
  for (let i = index; i < n - 1; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "shift-loop",
      explanation: `Index ${i} will take the value from index ${i + 1}.`,
      variables: { n, index, i }, state: snapshot(arr, { i }), highlights: [cell(i, "active", "i"), cell(i + 1, "compared")],
    });
    arr[i] = arr[i + 1]!;
    b.step({
      event: { type: "assign", target: indexRef(i), value: arr[i]! }, anchor: "shift",
      explanation: `Copy ${arr[i]} from index ${i + 1} to index ${i}.`,
      variables: { n, index, i }, state: snapshot(arr, { i }), changed: [indexRef(i)],
      highlights: [cell(i, "swapped"), cell(i + 1, "compared")], motion: "slide",
    });
  }
  const result = arr.slice(0, n - 1);
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `The last cell is now a leftover copy, so the array shrinks to ${n - 1} value${n - 1 === 1 ? "" : "s"}: ${fmt(result)}.`,
    variables: { n: n - 1 }, state: snapshot(result, {}), highlights: result.map((_, k) => cell(k, "sorted")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result });
}

export const deleteAtIndex: AlgorithmDefinition<DeleteAtIndexInput> = { id: ID, parseInput, run };
