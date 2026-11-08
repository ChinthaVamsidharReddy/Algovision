import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "quick-sort";
export interface QuickSortInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<QuickSortInput> {
  return parseArrayWithFields(raw, limits, {}) as InputResult<QuickSortInput>;
}

export function run(input: QuickSortInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  const fin = new Set<number>();
  const base = (lo: number, hi: number): Highlight[] => arr.map((_, k) => cell(k, fin.has(k) ? "sorted" : k >= lo && k <= hi ? "window" : "visited"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: n === 0 ? "The array is empty, so there is nothing to sort." : `Sort ${fmt(arr)}: pick a pivot, move smaller values left of it and larger values right of it, then sort each side.`,
    variables: { lo: 0, hi: n - 1 }, state: snapshot(arr, {}),
  });
  function sort(lo: number, hi: number, first: boolean): void {
    if (!first) {
      b.step({
        event: { type: "init" }, anchor: "entry",
        explanation: `Sort the range from index ${lo} to ${hi}.`,
        variables: { lo, hi }, state: snapshot(arr, { lo: ptr(lo, n), hi: ptr(hi, n) }), highlights: base(lo, hi),
      });
    }
    if (lo >= hi) {
      if (lo === hi) fin.add(lo);
      b.step({
        event: { type: "init" }, anchor: "base-case",
        explanation: lo === hi ? `One value (index ${lo}) is already in place, so return.` : "An empty range needs no work, so return.",
        variables: { lo, hi }, state: snapshot(arr, { lo: ptr(lo, n), hi: ptr(hi, n) }), highlights: base(lo, hi),
      });
      return;
    }
    const pivot = arr[hi]!;
    b.step({
      event: { type: "movePointer", pointer: "hi", to: indexRef(hi) }, anchor: "choose-pivot",
      explanation: `Choose the last value, ${pivot}, as the pivot.`,
      variables: { lo, hi, pivot }, state: snapshot(arr, { lo, hi }), highlights: [...base(lo, hi), cell(hi, "pointer", "pivot")],
    });
    let i = lo;
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "init-i",
      explanation: `i marks where the next value smaller than the pivot will go. It starts at index ${lo}.`,
      variables: { lo, hi, pivot, i }, state: snapshot(arr, { lo, hi, i }), highlights: [...base(lo, hi), cell(hi, "pointer", "pivot"), cell(i, "active", "i")],
    });
    for (let j = lo; j < hi; j++) {
      b.step({
        event: { type: "movePointer", pointer: "j", to: indexRef(j) }, anchor: "scan",
        explanation: `Look at index ${j}, which holds ${arr[j]}.`,
        variables: { lo, hi, pivot, i, j }, state: snapshot(arr, { lo, hi, i, j }), highlights: [...base(lo, hi), cell(hi, "pointer", "pivot"), cell(i, "active", "i"), cell(j, "active", "j")],
      });
      const smaller = arr[j]! < pivot;
      b.step({
        event: { type: "compare", a: indexRef(j), b: indexRef(hi) }, anchor: "compare",
        explanation: smaller ? `${arr[j]} < ${pivot}, so it belongs on the left side.` : `${arr[j]} >= ${pivot}, so it stays on the right side.`,
        variables: { i, j, pivot, "values[j]": arr[j]! }, state: snapshot(arr, { lo, hi, i, j }), highlights: [...base(lo, hi), cell(hi, "pointer", "pivot"), cell(j, "compared")],
      });
      if (smaller) {
        const a = arr[i]!;
        const c = arr[j]!;
        arr[i] = c;
        arr[j] = a;
        b.step({
          event: i === j ? { type: "movePointer", pointer: "i", to: indexRef(i) } : { type: "swap", a: indexRef(i), b: indexRef(j) }, anchor: "swap",
          explanation: i === j ? `i and j are the same cell, so the swap changes nothing.` : `Swap ${a} (index ${i}) with ${c} (index ${j}) to move the smaller value into the left part.`,
          variables: { i, j, pivot }, state: snapshot(arr, { lo, hi, i, j }), changed: i === j ? [] : [indexRef(i), indexRef(j)],
          highlights: [...base(lo, hi), cell(hi, "pointer", "pivot"), cell(i, "swapped"), cell(j, "swapped")], motion: i === j ? undefined : "swap",
        });
        i++;
        b.step({
          event: { type: "movePointer", pointer: "i", to: indexRef(Math.min(i, n - 1)) }, anchor: "advance",
          explanation: `Move i to index ${i}.`,
          variables: { i, j, pivot }, state: snapshot(arr, { lo, hi, i: ptr(i, n), j }), highlights: [...base(lo, hi), cell(hi, "pointer", "pivot")],
        });
      }
    }
    const a = arr[i]!;
    arr[i] = arr[hi]!;
    arr[hi] = a;
    fin.add(i);
    b.step({
      event: i === hi ? { type: "movePointer", pointer: "i", to: indexRef(i) } : { type: "swap", a: indexRef(i), b: indexRef(hi) }, anchor: "place-pivot",
      explanation: i === hi ? `The pivot ${pivot} is already at index ${i}, its final position.` : `Swap the pivot into index ${i}. Everything left of it is smaller and everything right is not, so ${pivot} is in its final place.`,
      variables: { lo, hi, pivot, i }, state: snapshot(arr, { lo, hi, i }), changed: i === hi ? [] : [indexRef(i), indexRef(hi)],
      highlights: [...base(lo, hi), cell(i, "found", "pivot")], motion: i === hi ? undefined : "swap",
    });
    b.step({
      event: { type: "init" }, anchor: "recurse-left",
      explanation: `Sort the values left of the pivot: indexes ${lo} to ${i - 1}.`,
      variables: { lo, hi, i }, state: snapshot(arr, { lo, hi, i }), highlights: base(lo, i - 1),
    });
    sort(lo, i - 1, false);
    b.step({
      event: { type: "init" }, anchor: "recurse-right",
      explanation: `Sort the values right of the pivot: indexes ${i + 1} to ${hi}.`,
      variables: { lo, hi, i }, state: snapshot(arr, { lo, hi, i }), highlights: base(i + 1, hi),
    });
    sort(i + 1, hi, false);
  }
  sort(0, n - 1, true);
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `Sorting is complete: ${fmt(arr)}.`,
    variables: {}, state: snapshot(arr, {}), highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return b.build({ time: "O(n log n) average, O(n²) worst", space: "O(log n)", result: arr });
}

export const quickSort: AlgorithmDefinition<QuickSortInput> = { id: ID, parseInput, run };
