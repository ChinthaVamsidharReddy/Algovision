import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "max-sum-subarray-k";
export interface MaxSumSubarrayInput { readonly values: readonly number[]; readonly k: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<MaxSumSubarrayInput> {
  return parseArrayWithFields(raw, limits, {
    minLength: 1,
    minLengthMessage: "Enter at least one value.",
    fields: [{ name: "k", label: "Window size k", min: () => 1, max: (v, l) => (v.length === 0 ? l.maxArrayLength : v.length), rangeMessage: (v) => `Window size k must be between 1 and ${v.length}.` }],
  }) as InputResult<MaxSumSubarrayInput>;
}

export function run(input: MaxSumSubarrayInput, limits: LimitProfile): ExecutionTrace {
  const { values, k } = input;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values], k }, maxSteps: limits.maxSteps });
  const win = (start: number, end: number): Highlight[] => values.map((_, i) => cell(i, i >= start && i <= end ? "window" : "visited"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the largest sum of any ${k} consecutive values in ${fmt(values)}. Instead of re-adding ${k} values each time, slide the window and adjust one sum.`,
    variables: { k }, state: snapshot(values, {}),
  });
  let windowSum = 0;
  b.step({
    event: { type: "assign", target: indexRef(0), value: 0 }, anchor: "init-sum",
    explanation: "Start the window sum at 0.", variables: { k, windowSum }, state: snapshot(values, {}),
  });
  for (let i = 0; i < k; i++) {
    windowSum += values[i]!;
    b.step({
      event: { type: "assign", target: indexRef(i), value: windowSum }, anchor: "first-window",
      explanation: `Add ${values[i]} from index ${i} to build the first window. The sum is ${windowSum}.`,
      variables: { k, windowSum, i }, state: snapshot(values, { left: 0, right: i }), highlights: win(0, i),
    });
  }
  let best = windowSum;
  let bestStart = 0;
  b.step({
    event: { type: "assign", target: indexRef(0), value: best }, anchor: "init-best",
    explanation: `The first window (indexes 0 to ${k - 1}) sums to ${best}, the best so far.`,
    variables: { k, windowSum, best }, state: snapshot(values, { left: 0, right: k - 1 }), highlights: win(0, k - 1),
  });
  for (let right = k; right < n; right++) {
    const left = right - k + 1;
    b.step({
      event: { type: "movePointer", pointer: "right", to: indexRef(right) }, anchor: "slide",
      explanation: `Slide the window one step right to indexes ${left} to ${right}.`,
      variables: { k, windowSum, best, left, right }, state: snapshot(values, { left, right }), highlights: win(left, right),
    });
    const out = values[right - k]!;
    const inn = values[right]!;
    windowSum += inn - out;
    b.step({
      event: { type: "assign", target: indexRef(right), value: windowSum }, anchor: "update-sum",
      explanation: `Add the new value ${inn} and remove the one that left, ${out}: the sum becomes ${windowSum}.`,
      variables: { k, windowSum, best, left, right }, state: snapshot(values, { left, right }),
      highlights: [...win(left, right), cell(right, "active", "in")],
    });
    const better = windowSum > best;
    b.step({
      event: { type: "compare", a: indexRef(left), b: indexRef(bestStart) }, anchor: "compare",
      explanation: better ? `${windowSum} > ${best}, a new best window.` : `${windowSum} <= ${best}, the best stays.`,
      variables: { k, windowSum, best, left, right }, state: snapshot(values, { left, right }), highlights: win(left, right),
    });
    if (better) {
      best = windowSum;
      bestStart = left;
      b.step({
        event: { type: "assign", target: indexRef(left), value: best }, anchor: "new-best",
        explanation: `Record ${best} as the best sum.`,
        variables: { k, windowSum, best, left, right }, state: snapshot(values, { left, right }),
        highlights: values.map((_, i) => cell(i, i >= left && i <= right ? "found" : "visited")),
      });
    }
  }
  b.step({
    event: { type: "found", element: indexRef(bestStart) }, anchor: "finish",
    explanation: `The best window is indexes ${bestStart} to ${bestStart + k - 1}, with sum ${best}.`,
    variables: { k, best }, state: snapshot(values, { left: bestStart, right: bestStart + k - 1 }),
    highlights: values.map((_, i) => cell(i, i >= bestStart && i < bestStart + k ? "found" : "visited")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: best });
}

export const maxSumSubarrayK: AlgorithmDefinition<MaxSumSubarrayInput> = { id: ID, parseInput, run };
