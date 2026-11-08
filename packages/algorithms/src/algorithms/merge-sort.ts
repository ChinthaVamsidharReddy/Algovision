import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "merge-sort";
export interface MergeSortInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<MergeSortInput> {
  return parseArrayWithFields(raw, limits, {}) as InputResult<MergeSortInput>;
}

export function run(input: MergeSortInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const temp = new Array<number>(n).fill(0);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  const win = (lo: number, hi: number, extra: Highlight[] = []): Highlight[] => [...arr.map((_, k) => cell(k, k >= lo && k <= hi ? "window" : "visited")), ...extra];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: n === 0 ? "The array is empty, so there is nothing to sort." : `Sort ${fmt(arr)} by splitting it in halves, sorting each half, then merging the two sorted halves.`,
    variables: { lo: 0, hi: n - 1 }, state: snapshot(arr, {}),
  });
  function sort(lo: number, hi: number, first: boolean): void {
    if (!first) {
      b.step({
        event: { type: "init" }, anchor: "entry",
        explanation: `Sort the range from index ${lo} to ${hi}.`,
        variables: { lo, hi }, state: snapshot(arr, { lo: ptr(lo, n), hi: ptr(hi, n) }), highlights: win(lo, hi),
      });
    }
    if (lo >= hi) {
      b.step({
        event: { type: "init" }, anchor: "base-case",
        explanation: lo === hi ? `A range with one value (index ${lo}) is already sorted, so return.` : "An empty range is already sorted, so return.",
        variables: { lo, hi }, state: snapshot(arr, { lo: ptr(lo, n), hi: ptr(hi, n) }), highlights: lo === hi ? [cell(lo, "sorted")] : [],
      });
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    b.step({
      event: { type: "movePointer", pointer: "mid", to: indexRef(mid) }, anchor: "split",
      explanation: `Split at the middle, index ${mid}: the left half is ${lo} to ${mid} and the right half is ${mid + 1} to ${hi}.`,
      variables: { lo, hi, mid }, state: snapshot(arr, { lo, hi, mid }), highlights: win(lo, hi, [cell(mid, "active", "mid")]),
    });
    b.step({
      event: { type: "init" }, anchor: "recurse-left",
      explanation: `First sort the left half, indexes ${lo} to ${mid}.`,
      variables: { lo, hi, mid }, state: snapshot(arr, { lo, hi, mid }), highlights: win(lo, mid),
    });
    sort(lo, mid, false);
    b.step({
      event: { type: "init" }, anchor: "recurse-right",
      explanation: `Now sort the right half, indexes ${mid + 1} to ${hi}.`,
      variables: { lo, hi, mid }, state: snapshot(arr, { lo, hi, mid }), highlights: win(mid + 1, hi),
    });
    sort(mid + 1, hi, false);
    b.step({
      event: { type: "init" }, anchor: "merge-call",
      explanation: `Both halves are sorted. Merge them: ${fmt(arr.slice(lo, mid + 1))} and ${fmt(arr.slice(mid + 1, hi + 1))}.`,
      variables: { lo, hi, mid }, state: snapshot(arr, { lo, hi, mid }), highlights: win(lo, hi),
    });
    let i = lo;
    let j = mid + 1;
    let k = lo;
    b.step({
      event: { type: "init" }, anchor: "merge-init",
      explanation: `Use i for the left half, j for the right half and k for the next free slot in the temporary buffer.`,
      variables: { i, j, k }, state: snapshot(arr, { i, j: j <= hi ? j : null }), highlights: win(lo, hi, [cell(i, "active", "i"), cell(j, "active", "j")]),
    });
    while (i <= mid && j <= hi) {
      const takeLeft = arr[i]! <= arr[j]!;
      b.step({
        event: { type: "compare", a: indexRef(i), b: indexRef(j) }, anchor: "merge-compare",
        explanation: takeLeft ? `${arr[i]} <= ${arr[j]}, so the left value goes next.` : `${arr[i]} > ${arr[j]}, so the right value goes next.`,
        variables: { i, j, k }, state: snapshot(arr, { i, j }), highlights: win(lo, hi, [cell(i, "compared", "i"), cell(j, "compared", "j")]),
      });
      const from = takeLeft ? i : j;
      temp[k] = arr[from]!;
      b.step({
        event: { type: "assign", target: indexRef(k), value: temp[k]! }, anchor: takeLeft ? "take-left" : "take-right",
        explanation: `Copy ${temp[k]} from index ${from} into temp[${k}]. Merged so far: ${fmt(temp.slice(lo, k + 1))}.`,
        variables: { i, j, k, "temp[k]": temp[k]! }, state: snapshot(arr, { i: takeLeft ? i : i, j }), highlights: win(lo, hi, [cell(from, "found")]),
      });
      if (takeLeft) i++; else j++;
      k++;
    }
    while (i <= mid || j <= hi) {
      const from = i <= mid ? i : j;
      temp[k] = arr[from]!;
      b.step({
        event: { type: "assign", target: indexRef(k), value: temp[k]! }, anchor: "copy-rest",
        explanation: `One half is used up, so copy the rest of the other half: ${arr[from]} goes to temp[${k}].`,
        variables: { i, j, k }, state: snapshot(arr, {}), highlights: win(lo, hi, [cell(from, "found")]),
      });
      if (i <= mid) i++; else j++;
      k++;
    }
    for (let t = lo; t <= hi; t++) arr[t] = temp[t]!;
    b.step({
      event: { type: "assign", target: indexRef(lo), value: arr[lo]! }, anchor: "write-back",
      explanation: `Write the merged result back: indexes ${lo} to ${hi} now hold ${fmt(arr.slice(lo, hi + 1))}.`,
      variables: { lo, hi }, state: snapshot(arr, {}), changed: Array.from({ length: hi - lo + 1 }, (_, t) => indexRef(lo + t)),
      highlights: arr.map((_, t) => cell(t, t >= lo && t <= hi ? "sorted" : "visited")), motion: "appear",
    });
    b.step({
      event: { type: "init" }, anchor: "finish",
      explanation: `Range ${lo} to ${hi} is sorted. Return to the caller.`,
      variables: { lo, hi }, state: snapshot(arr, {}), highlights: arr.map((_, t) => cell(t, t >= lo && t <= hi ? "sorted" : "visited")),
    });
  }
  sort(0, n - 1, true);
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `Sorting is complete: ${fmt(arr)}.`,
    variables: {}, state: snapshot(arr, {}), highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return b.build({ time: "O(n log n)", space: "O(n)", result: arr });
}

export const mergeSort: AlgorithmDefinition<MergeSortInput> = { id: ID, parseInput, run };
