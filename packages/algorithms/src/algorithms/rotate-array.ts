import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "rotate-array";
export interface RotateInput { readonly values: readonly number[]; readonly k: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<RotateInput> {
  return parseArrayWithFields(raw, limits, {
    fields: [{ name: "k", label: "Rotate left by k", min: () => 0, max: (v) => v.length, rangeMessage: (v) => `Rotate left by k must be between 0 and ${v.length}.` }],
  }) as InputResult<RotateInput>;
}

export function run(input: RotateInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values], k: input.k }, maxSteps: limits.maxSteps });
  const span = (lo: number, hi: number, extra: Highlight[] = []): Highlight[] => [...arr.map((_, t) => cell(t, t >= lo && t <= hi ? "window" : "visited")), ...extra];

  function reverse(lo0: number, hi0: number, label: string): void {
    let lo = lo0;
    let hi = hi0;
    while (lo < hi) {
      b.step({
        event: { type: "compare", a: indexRef(lo), b: indexRef(hi) }, anchor: "rev-loop",
        explanation: `lo (${lo}) < hi (${hi}), so swap this pair of the ${label}.`,
        variables: { lo, hi }, state: snapshot(arr, { lo, hi }), highlights: span(lo0, hi0, [cell(lo, "active", "lo"), cell(hi, "active", "hi")]),
      });
      const a = arr[lo]!;
      arr[lo] = arr[hi]!;
      arr[hi] = a;
      b.step({
        event: { type: "swap", a: indexRef(lo), b: indexRef(hi) }, anchor: "rev-swap",
        explanation: `Swap ${a} and ${arr[lo]}.`,
        variables: { lo, hi }, state: snapshot(arr, { lo, hi }), changed: [indexRef(lo), indexRef(hi)], highlights: span(lo0, hi0, [cell(lo, "swapped"), cell(hi, "swapped")]), motion: "swap",
      });
      lo++;
      hi--;
      b.step({
        event: { type: "init" }, anchor: "rev-move",
        explanation: `Move both ends inward: lo = ${lo}, hi = ${hi}.`,
        variables: { lo, hi }, state: snapshot(arr, { lo: ptr(lo, n), hi: ptr(hi, n) }), highlights: span(lo0, hi0),
      });
    }
  }

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Rotate ${fmt(arr)} left by ${input.k} without a second array, using three reversals: the first ${input.k} values, the rest, then the whole array.`,
    variables: { n, k: input.k }, state: snapshot(arr, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "empty-check",
    explanation: n === 0 ? "The array is empty, so there is nothing to rotate." : "The array is not empty, so continue.",
    variables: { n }, state: snapshot(arr, {}),
  });
  if (n === 0) return b.build({ time: "O(n)", space: "O(1)", result: arr });
  const k = input.k % n;
  b.step({
    event: { type: "init" }, anchor: "normalize",
    explanation: `Rotating by ${input.k} is the same as rotating by ${input.k} mod ${n} = ${k}.`,
    variables: { n, k }, state: snapshot(arr, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "rev-first",
    explanation: k === 0 ? "k is 0, so this first range is empty." : `Reverse the first ${k} values (indexes 0 to ${k - 1}).`,
    variables: { k }, state: snapshot(arr, {}), highlights: k > 0 ? span(0, k - 1) : [],
  });
  reverse(0, k - 1, "first part");
  b.step({
    event: { type: "init" }, anchor: "rev-second",
    explanation: `Reverse the remaining values (indexes ${k} to ${n - 1}).`,
    variables: { k }, state: snapshot(arr, {}), highlights: span(k, n - 1),
  });
  reverse(k, n - 1, "second part");
  b.step({
    event: { type: "init" }, anchor: "rev-all",
    explanation: `Reverse the whole array. Each part flips back, and the two parts end up swapped.`,
    variables: { k }, state: snapshot(arr, {}), highlights: span(0, n - 1),
  });
  reverse(0, n - 1, "whole array");
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `Done. Rotated left by ${k}: ${fmt(arr)}.`,
    variables: { k }, state: snapshot(arr, {}), highlights: arr.map((_, t) => cell(t, "sorted")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: arr });
}

export const rotateArray: AlgorithmDefinition<RotateInput> = { id: ID, parseInput, run };
