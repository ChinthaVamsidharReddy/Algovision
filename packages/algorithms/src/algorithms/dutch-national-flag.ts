import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "dutch-national-flag";
export interface FlagInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<FlagInput> {
  return parseArrayWithFields(raw, limits, { valueMin: 0, valueMax: 2, valueMessage: "Each value must be 0, 1 or 2 (three colours)." }) as InputResult<FlagInput>;
}

export function run(input: FlagInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  let low = 0;
  let mid = 0;
  let high = n - 1;
  const ptrs = () => ({ low: ptr(low, n), mid: ptr(mid, n), high: ptr(high, n) });
  const zones = (extra: Highlight[] = []): Highlight[] => [
    ...arr.map((_, k) => cell(k, k < low ? "sorted" : k < mid ? "found" : k > high ? "sorted" : "visited")),
    ...extra,
  ];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Sort the 0s, 1s and 2s in ${fmt(arr)} in a single pass. Three pointers split the array into: 0s before low, 1s between low and mid, unknown from mid to high, 2s after high.`,
    variables: {}, state: snapshot(arr, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init",
    explanation: `low = 0, mid = 0, high = ${n - 1}. Nothing is placed yet, so everything is unknown.`,
    variables: { low, mid, high }, state: snapshot(arr, ptrs()), highlights: zones(),
  });
  while (mid <= high) {
    b.step({
      event: { type: "compare", a: indexRef(mid), b: indexRef(mid) }, anchor: "loop",
      explanation: `mid (${mid}) <= high (${high}), so index ${mid} is still unknown.`,
      variables: { low, mid, high }, state: snapshot(arr, ptrs()), highlights: zones([cell(mid, "active", "mid")]),
    });
    const v = arr[mid]!;
    b.step({
      event: { type: "compare", a: indexRef(mid), b: indexRef(mid) }, anchor: "check-zero",
      explanation: v === 0 ? "It is 0: it belongs in the front." : `It is ${v}, not 0.`,
      variables: { low, mid, high, "values[mid]": v }, state: snapshot(arr, ptrs()), highlights: zones([cell(mid, "compared")]),
    });
    if (v === 0) {
      const lo0 = low;
      const mid0 = mid;
      const a = arr[low]!;
      arr[low] = arr[mid]!;
      arr[mid] = a;
      low++;
      mid++;
      b.step({
        event: lo0 === mid0 ? { type: "movePointer", pointer: "low", to: indexRef(lo0) } : { type: "swap", a: indexRef(lo0), b: indexRef(mid0) }, anchor: "zero-swap",
        explanation: lo0 === mid0 ? "low and mid are the same cell, so the 0 is already in place. Advance both." : `Swap the 0 into index ${lo0}, then advance low and mid.`,
        variables: { low, mid, high }, state: snapshot(arr, ptrs()), changed: lo0 === mid0 ? [] : [indexRef(lo0), indexRef(mid0)],
        highlights: zones([cell(lo0, "swapped"), cell(mid0, "swapped")]), motion: lo0 === mid0 ? undefined : "swap",
      });
      continue;
    }
    b.step({
      event: { type: "compare", a: indexRef(mid), b: indexRef(mid) }, anchor: "check-one",
      explanation: v === 1 ? "It is 1: it is already in the middle zone." : "It is 2: it belongs at the back.",
      variables: { low, mid, high, "values[mid]": v }, state: snapshot(arr, ptrs()), highlights: zones([cell(mid, "compared")]),
    });
    if (v === 1) {
      mid++;
      b.step({
        event: { type: "movePointer", pointer: "mid", to: indexRef(Math.min(mid, n - 1)) }, anchor: "one-advance",
        explanation: `Leave the 1 where it is and advance mid to ${mid}.`,
        variables: { low, mid, high }, state: snapshot(arr, ptrs()), highlights: zones(),
      });
    } else {
      const mid0 = mid;
      const high0 = high;
      const a = arr[mid]!;
      arr[mid] = arr[high]!;
      arr[high] = a;
      high--;
      b.step({
        event: mid0 === high0 ? { type: "movePointer", pointer: "high", to: indexRef(high0) } : { type: "swap", a: indexRef(mid0), b: indexRef(high0) }, anchor: "two-swap",
        explanation: mid0 === high0 ? "mid and high are the same cell: the 2 is already at the back. Shrink high." : `Swap the 2 to index ${high0}, then shrink high. The value that arrived at mid is still unknown, so mid does not move.`,
        variables: { low, mid, high }, state: snapshot(arr, ptrs()), changed: mid0 === high0 ? [] : [indexRef(mid0), indexRef(high0)],
        highlights: zones([cell(mid0, "swapped"), cell(high0, "swapped")]), motion: mid0 === high0 ? undefined : "swap",
      });
    }
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `mid has passed high, so every value is placed: ${fmt(arr)}.`,
    variables: { low, mid, high }, state: snapshot(arr, {}), highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: arr });
}

export const dutchNationalFlag: AlgorithmDefinition<FlagInput> = { id: ID, parseInput, run };
