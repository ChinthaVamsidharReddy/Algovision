import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "reverse-in-place";
export interface ReverseInPlaceInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<ReverseInPlaceInput> {
  return parseArrayWithFields(raw, limits, {}) as InputResult<ReverseInPlaceInput>;
}

export function run(input: ReverseInPlaceInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  let left = 0;
  let right = n - 1;
  const pointers = () => ({ left: ptr(left, n), right: ptr(right, n) });
  const around = (): Highlight[] => arr.map((_, k) => cell(k, k < left || k > right ? "sorted" : "window"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Reverse ${fmt(arr)} without a second array. Two pointers start at the ends, swap their values and move inward.`,
    variables: {}, state: snapshot(arr, {}),
  });
  b.step({
    event: { type: "movePointer", pointer: "left", to: n > 0 ? indexRef(0) : null }, anchor: "init-left",
    explanation: "Put left on the first cell.", variables: { left }, state: snapshot(arr, { left: ptr(left, n) }),
    highlights: n > 0 ? [cell(0, "active", "left")] : [],
  });
  b.step({
    event: { type: "movePointer", pointer: "right", to: n > 0 ? indexRef(n - 1) : null }, anchor: "init-right",
    explanation: n > 0 ? "Put right on the last cell." : "The array is empty, so right is -1.",
    variables: { left, right }, state: snapshot(arr, pointers()), highlights: around(),
  });
  while (left < right) {
    b.step({
      event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "loop",
      explanation: `left (${left}) < right (${right}), so this pair still needs swapping.`,
      variables: { left, right }, state: snapshot(arr, pointers()), highlights: [...around(), cell(left, "compared"), cell(right, "compared")],
    });
    const a = arr[left]!;
    const c = arr[right]!;
    arr[left] = c;
    arr[right] = a;
    b.step({
      event: { type: "swap", a: indexRef(left), b: indexRef(right) }, anchor: "swap",
      explanation: `Swap ${a} and ${c}.`,
      variables: { left, right, "values[left]": c, "values[right]": a }, state: snapshot(arr, pointers()),
      changed: [indexRef(left), indexRef(right)], highlights: [...around(), cell(left, "swapped"), cell(right, "swapped")], motion: "swap",
    });
    left++;
    right--;
    b.step({
      event: { type: "movePointer", pointer: "left", to: ptr(left, n) === null ? null : indexRef(left) }, anchor: "move",
      explanation: `Move both pointers inward: left is ${left}, right is ${right}.`,
      variables: { left, right }, state: snapshot(arr, pointers()), highlights: around(),
    });
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `The pointers have met or crossed, so every pair is swapped. The reversed array is ${fmt(arr)}.`,
    variables: { left, right }, state: snapshot(arr, {}), highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: arr });
}

export const reverseInPlace: AlgorithmDefinition<ReverseInPlaceInput> = { id: ID, parseInput, run };
