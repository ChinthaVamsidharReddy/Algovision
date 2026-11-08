import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "heap-sort";
export interface HeapSortInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<HeapSortInput> {
  return parseArrayWithFields(raw, limits, {}) as InputResult<HeapSortInput>;
}

export function run(input: HeapSortInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  let sortedFrom = n; // indexes >= sortedFrom are final
  const view = (size: number, extra: Highlight[] = []): Highlight[] => [
    ...arr.map((_, k) => cell(k, k >= sortedFrom ? "sorted" : k < size ? "window" : "visited")),
    ...extra,
  ];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: n === 0 ? "The array is empty, so there is nothing to sort." : `Sort ${fmt(arr)} with a max-heap: first arrange the array so every parent is at least as large as its children, then repeatedly move the biggest value to the end.`,
    variables: { n }, state: snapshot(arr, {}),
  });

  function siftDown(root0: number, size: number): void {
    let root = root0;
    b.step({
      event: { type: "init" }, anchor: "sift-entry",
      explanation: `Sift the value ${arr[root]} at index ${root} down until both children are not larger. The heap is the first ${size} cells.`,
      variables: { root, size }, state: snapshot(arr, { root }), highlights: view(size, [cell(root, "active", "root")]),
    });
    for (;;) {
      let largest = root;
      const left = 2 * root + 1;
      const right = left + 1;
      b.step({
        event: { type: "movePointer", pointer: "largest", to: indexRef(root) }, anchor: "pick-largest",
        explanation: `Assume the root, index ${root} (${arr[root]}), is the largest of the three. Its children are at ${left} and ${right}.`,
        variables: { root, size, largest, left, right }, state: snapshot(arr, { root, largest }), highlights: view(size, [cell(root, "active", "root")]),
      });
      const leftWins = left < size && arr[left]! > arr[largest]!;
      b.step({
        event: { type: "compare", a: indexRef(Math.min(left, n - 1)), b: indexRef(largest) }, anchor: "compare-left",
        explanation: left >= size ? `There is no left child (index ${left} is outside the heap).` : leftWins ? `Left child ${arr[left]} > ${arr[largest]}, so it becomes the largest.` : `Left child ${arr[left]} is not larger than ${arr[largest]}.`,
        variables: { root, largest, left, right }, state: snapshot(arr, { root, largest }), highlights: view(size, [cell(root, "active", "root"), ...(left < size ? [cell(left, "compared", "left")] : [])]),
      });
      if (leftWins) largest = left;
      const rightWins = right < size && arr[right]! > arr[largest]!;
      b.step({
        event: { type: "compare", a: indexRef(Math.min(right, n - 1)), b: indexRef(largest) }, anchor: "compare-right",
        explanation: right >= size ? `There is no right child (index ${right} is outside the heap).` : rightWins ? `Right child ${arr[right]} > ${arr[largest]}, so it becomes the largest.` : `Right child ${arr[right]} is not larger than ${arr[largest]}.`,
        variables: { root, largest, left, right }, state: snapshot(arr, { root, largest }), highlights: view(size, [cell(root, "active", "root"), ...(right < size ? [cell(right, "compared", "right")] : [])]),
      });
      if (rightWins) largest = right;
      if (largest === root) {
        b.step({
          event: { type: "init" }, anchor: "sift-done",
          explanation: `The root is already the largest of its family, so the heap rule holds here. Stop sifting.`,
          variables: { root, largest }, state: snapshot(arr, { root }), highlights: view(size, [cell(root, "found", "root")]),
        });
        return;
      }
      const a = arr[root]!;
      arr[root] = arr[largest]!;
      arr[largest] = a;
      b.step({
        event: { type: "swap", a: indexRef(root), b: indexRef(largest) }, anchor: "sift-swap",
        explanation: `Swap ${a} with its larger child ${arr[root]} so the bigger value moves up.`,
        variables: { root, largest }, state: snapshot(arr, { root, largest }), changed: [indexRef(root), indexRef(largest)],
        highlights: view(size, [cell(root, "swapped"), cell(largest, "swapped")]), motion: "swap",
      });
      root = largest;
      b.step({
        event: { type: "movePointer", pointer: "root", to: indexRef(root) }, anchor: "sift-move",
        explanation: `Continue from index ${root}, where ${a} now sits.`,
        variables: { root, size }, state: snapshot(arr, { root }), highlights: view(size, [cell(root, "active", "root")]),
      });
    }
  }

  for (let start = Math.floor(n / 2) - 1; start >= 0; start--) {
    b.step({
      event: { type: "movePointer", pointer: "start", to: indexRef(start) }, anchor: "build-heap",
      explanation: `Build the heap from the bottom up: fix the subtree rooted at index ${start}.`,
      variables: { start, n }, state: snapshot(arr, { start }), highlights: view(n, [cell(start, "active", "start")]),
    });
    siftDown(start, n);
  }
  for (let end = n - 1; end > 0; end--) {
    b.step({
      event: { type: "movePointer", pointer: "end", to: indexRef(end) }, anchor: "extract-loop",
      explanation: `The largest value is at the top (index 0). Move it to index ${end}, just after the shrinking heap.`,
      variables: { end }, state: snapshot(arr, { end }), highlights: view(end + 1, [cell(0, "active", "top"), cell(end, "active", "end")]),
    });
    const a = arr[0]!;
    arr[0] = arr[end]!;
    arr[end] = a;
    sortedFrom = end;
    b.step({
      event: { type: "swap", a: indexRef(0), b: indexRef(end) }, anchor: "extract-swap",
      explanation: `Swap ${a} (the maximum) with ${arr[0]}. ${a} is now in its final position.`,
      variables: { end }, state: snapshot(arr, { end }), changed: [indexRef(0), indexRef(end)],
      highlights: view(end, [cell(0, "swapped")]), motion: "swap",
    });
    siftDown(0, end);
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `The array is sorted: ${fmt(arr)}.`,
    variables: {}, state: snapshot(arr, {}), highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return b.build({ time: "O(n log n)", space: "O(1)", result: arr });
}

export const heapSort: AlgorithmDefinition<HeapSortInput> = { id: ID, parseInput, run };
