import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "two-sum-sorted";
export interface TwoSumSortedInput { readonly values: readonly number[]; readonly target: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<TwoSumSortedInput> {
  return parseArrayWithFields(raw, limits, {
    sortedMessage: "Values must be in ascending order for the two-pointer scan.",
    fields: [{ name: "target", label: "Target sum", min: (_v, l) => -2 * l.maxAbsValue, max: (_v, l) => 2 * l.maxAbsValue }],
  }) as InputResult<TwoSumSortedInput>;
}

export function run(input: TwoSumSortedInput, limits: LimitProfile): ExecutionTrace {
  const { values, target } = input;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values], target }, maxSteps: limits.maxSteps });
  let left = 0;
  let right = n - 1;
  const pointers = () => ({ left: ptr(left, n), right: ptr(right, n) });
  const span = (): Highlight[] => values.map((_, k) => cell(k, k >= left && k <= right ? "window" : "visited"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find two values in the sorted array ${fmt(values)} that add up to ${target}. One pointer starts at each end and they walk toward each other.`,
    variables: { target }, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "movePointer", pointer: "left", to: n > 0 ? indexRef(0) : null }, anchor: "init-left",
    explanation: "Put left on the smallest value, the first cell.",
    variables: { target, left }, state: snapshot(values, { left: ptr(left, n) }), highlights: n > 0 ? [cell(0, "active", "left")] : [],
  });
  b.step({
    event: { type: "movePointer", pointer: "right", to: n > 0 ? indexRef(n - 1) : null }, anchor: "init-right",
    explanation: n > 0 ? "Put right on the largest value, the last cell." : "The array is empty, so right is -1.",
    variables: { target, left, right }, state: snapshot(values, pointers()), highlights: span(),
  });
  let found: [number, number] | null = null;
  while (left < right) {
    b.step({
      event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "loop",
      explanation: `left (${left}) < right (${right}), so there are still two different cells to try.`,
      variables: { target, left, right }, state: snapshot(values, pointers()), highlights: [...span(), cell(left, "active", "left"), cell(right, "active", "right")],
    });
    const sum = values[left]! + values[right]!;
    b.step({
      event: { type: "assign", target: indexRef(left), value: sum }, anchor: "sum",
      explanation: `${values[left]} + ${values[right]} = ${sum}.`,
      variables: { target, left, right, sum }, state: snapshot(values, pointers()), highlights: [...span(), cell(left, "compared"), cell(right, "compared")],
    });
    b.step({
      event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "check-equal",
      explanation: sum === target ? `${sum} equals the target ${target}.` : `${sum} is not the target ${target}.`,
      variables: { target, left, right, sum }, state: snapshot(values, pointers()), highlights: [...span(), cell(left, "compared"), cell(right, "compared")],
    });
    if (sum === target) {
      found = [left, right];
      b.step({
        event: { type: "found", element: indexRef(left) }, anchor: "found",
        explanation: `Found it: ${values[left]} (index ${left}) + ${values[right]} (index ${right}) = ${target}.`,
        variables: { target, left, right, sum }, state: snapshot(values, pointers()), highlights: [...span(), cell(left, "found"), cell(right, "found")],
      });
      break;
    }
    const tooSmall = sum < target;
    b.step({
      event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "check-less",
      explanation: tooSmall ? `${sum} < ${target}: the sum is too small, so we need a bigger left value.` : `${sum} > ${target}: the sum is too big, so we need a smaller right value.`,
      variables: { target, left, right, sum }, state: snapshot(values, pointers()), highlights: [...span(), cell(left, "compared"), cell(right, "compared")],
    });
    if (tooSmall) {
      left++;
      b.step({
        event: { type: "movePointer", pointer: "left", to: indexRef(left) }, anchor: "move-left",
        explanation: `Move left right to index ${left}. The old left value can never be part of an answer.`,
        variables: { target, left, right, sum }, state: snapshot(values, pointers()), highlights: [...span(), cell(left, "active", "left")],
      });
    } else {
      right--;
      b.step({
        event: { type: "movePointer", pointer: "right", to: indexRef(right) }, anchor: "move-right",
        explanation: `Move right left to index ${right}. The old right value can never be part of an answer.`,
        variables: { target, left, right, sum }, state: snapshot(values, pointers()), highlights: [...span(), cell(right, "active", "right")],
      });
    }
  }
  if (!found) {
    b.step({
      event: { type: "notFound" }, anchor: "not-found",
      explanation: `The pointers met without finding two values that add up to ${target}.`,
      variables: { target, left, right }, state: snapshot(values, pointers()), highlights: values.map((_, k) => cell(k, "visited")),
    });
  }
  return b.build({ time: "O(n)", space: "O(1)", result: found ? [found[0], found[1]] : [] });
}

export const twoSumSorted: AlgorithmDefinition<TwoSumSortedInput> = { id: ID, parseInput, run };
