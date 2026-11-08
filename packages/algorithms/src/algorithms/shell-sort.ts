import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "shell-sort";
export interface ShellSortInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<ShellSortInput> {
  return parseArrayWithFields(raw, limits, {}) as InputResult<ShellSortInput>;
}

export function run(input: ShellSortInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  const lane = (start: number, gap: number): Highlight[] => arr.map((_, k) => cell(k, k % gap === start % gap ? "window" : "visited"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: n === 0 ? "The array is empty, so there is nothing to sort." : `Sort ${fmt(arr)} with insertion sort on values that are a gap apart, shrinking the gap until it is 1.`,
    variables: { n }, state: snapshot(arr, {}),
  });
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    b.step({
      event: { type: "init" }, anchor: "gap-loop",
      explanation: `Gap = ${gap}. Compare and insert values that are ${gap} position${gap === 1 ? "" : "s"} apart.`,
      variables: { gap }, state: snapshot(arr, {}), highlights: lane(gap % gap, gap),
    });
    for (let i = gap; i < n; i++) {
      const temp = arr[i]!;
      let j = i;
      b.step({
        event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "pick",
        explanation: `Pick up ${temp} from index ${i}. It will be inserted among the values at indexes ${i % gap}, ${(i % gap) + gap}, ... that are before it.`,
        variables: { gap, i, temp }, state: snapshot(arr, { i }), highlights: [...lane(i % gap, gap), cell(i, "active", "temp")],
      });
      for (;;) {
        const go = j >= gap && arr[j - gap]! > temp;
        b.step({
          event: { type: "compare", a: indexRef(j >= gap ? j - gap : j), b: indexRef(j) }, anchor: "compare",
          explanation: j < gap ? `Index ${j} has no value ${gap} places to its left, so stop.` : go ? `${arr[j - gap]} > ${temp}, so ${arr[j - gap]} must move ${gap} place${gap === 1 ? "" : "s"} right.` : `${arr[j - gap]} <= ${temp}, so ${temp} belongs at index ${j}.`,
          variables: { gap, i, j, temp }, state: snapshot(arr, { i, j }), highlights: [...lane(i % gap, gap), cell(j, "compared", "j"), ...(j >= gap ? [cell(j - gap, "compared")] : [])],
        });
        if (!go) break;
        arr[j] = arr[j - gap]!;
        b.step({
          event: { type: "assign", target: indexRef(j), value: arr[j]! }, anchor: "shift",
          explanation: `Copy ${arr[j]} from index ${j - gap} to index ${j}.`,
          variables: { gap, i, j, temp }, state: snapshot(arr, { i, j }), changed: [indexRef(j)], highlights: [...lane(i % gap, gap), cell(j, "swapped")], motion: "slide",
        });
        j -= gap;
      }
      arr[j] = temp;
      b.step({
        event: { type: "assign", target: indexRef(j), value: temp }, anchor: "place",
        explanation: `Put ${temp} at index ${j}.`,
        variables: { gap, i, j, temp }, state: snapshot(arr, { i, j }), changed: [indexRef(j)], highlights: [...lane(i % gap, gap), cell(j, "found")], motion: "appear",
      });
    }
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `The array is sorted: ${fmt(arr)}.`,
    variables: {}, state: snapshot(arr, {}), highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return b.build({ time: "O(n²) worst, about O(n log² n) with good gaps", space: "O(1)", result: arr });
}

export const shellSort: AlgorithmDefinition<ShellSortInput> = { id: ID, parseInput, run };
