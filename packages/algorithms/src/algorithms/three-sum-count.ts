import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "three-sum-count";
export interface ThreeSumInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<ThreeSumInput> {
  return parseArrayWithFields(raw, limits, { sortedMessage: "Values must be in ascending order so the two pointers can walk inward." }) as InputResult<ThreeSumInput>;
}

export function run(input: ThreeSumInput, limits: LimitProfile): ExecutionTrace {
  const v = input.values;
  const n = v.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...v] }, maxSteps: limits.maxSteps });
  let count = 0;
  let i = 0;
  let left = 0;
  let right = n - 1;
  const ptrs = () => ({ i: ptr(i, n), left: ptr(left, n), right: ptr(right, n) });
  const hl = (extra: Highlight[] = []): Highlight[] => [...v.map((_, k) => cell(k, k > left - 1 && k < right + 1 && k > i ? "window" : "visited")), cell(i, "active", "i"), ...extra];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Count the different triplets in the sorted array ${fmt(v)} that add up to 0. Fix one value i, then use two pointers on the values after it.`,
    variables: {}, state: snapshot(v, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-count", explanation: "Start the triplet count at 0.", variables: { count }, state: snapshot(v, {}),
  });
  for (i = 0; i < n - 2; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "outer",
      explanation: `Fix i = ${i} (value ${v[i]}). We need two later values that sum to ${-v[i]!}.`,
      variables: { i, count }, state: snapshot(v, { i }), highlights: [cell(i, "active", "i")],
    });
    if (i > 0 && v[i] === v[i - 1]) {
      b.step({
        event: { type: "compare", a: indexRef(i - 1), b: indexRef(i) }, anchor: "skip-dup-i",
        explanation: `${v[i]} is the same as the previous value, so it would only repeat triplets already counted. Skip it.`,
        variables: { i, count }, state: snapshot(v, { i }), highlights: [cell(i - 1, "compared"), cell(i, "compared")],
      });
      continue;
    }
    left = i + 1;
    right = n - 1;
    b.step({
      event: { type: "init" }, anchor: "init-pointers",
      explanation: `left starts at ${left} and right at ${right}.`,
      variables: { i, left, right, count }, state: snapshot(v, ptrs()), highlights: hl([cell(left, "active", "left"), cell(right, "active", "right")]),
    });
    while (left < right) {
      b.step({
        event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "loop",
        explanation: `left (${left}) < right (${right}), so keep searching.`,
        variables: { i, left, right, count }, state: snapshot(v, ptrs()), highlights: hl([cell(left, "active", "left"), cell(right, "active", "right")]),
      });
      const sum = v[i]! + v[left]! + v[right]!;
      b.step({
        event: { type: "assign", target: indexRef(i), value: sum }, anchor: "sum",
        explanation: `${v[i]} + ${v[left]} + ${v[right]} = ${sum}.`,
        variables: { i, left, right, sum, count }, state: snapshot(v, ptrs()), highlights: hl([cell(left, "compared"), cell(right, "compared")]),
      });
      b.step({
        event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "check-zero",
        explanation: sum === 0 ? "The sum is 0: a triplet!" : `The sum is not 0.`,
        variables: { i, left, right, sum, count }, state: snapshot(v, ptrs()), highlights: hl([cell(left, "compared"), cell(right, "compared")]),
      });
      if (sum === 0) {
        count++;
        left++;
        right--;
        b.step({
          event: { type: "found", element: indexRef(left - 1) }, anchor: "found",
          explanation: `Found triplet #${count}. Move both pointers inward to look for more.`,
          variables: { i, left, right, count }, state: snapshot(v, ptrs()), highlights: hl([cell(left - 1, "found"), cell(right + 1, "found")]),
        });
        while (left < right && v[left] === v[left - 1]) {
          left++;
          b.step({
            event: { type: "movePointer", pointer: "left", to: indexRef(left) }, anchor: "skip-dup",
            explanation: `${v[left - 1]} repeats the previous left value, so skip it to avoid counting the same triplet twice.`,
            variables: { i, left, right, count }, state: snapshot(v, ptrs()), highlights: hl(),
          });
        }
        continue;
      }
      b.step({
        event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "check-neg",
        explanation: sum < 0 ? `${sum} < 0: the sum is too small, so move left up to a bigger value.` : `${sum} > 0: the sum is too big, so move right down to a smaller value.`,
        variables: { i, left, right, sum }, state: snapshot(v, ptrs()), highlights: hl([cell(left, "compared"), cell(right, "compared")]),
      });
      if (sum < 0) {
        left++;
        b.step({
          event: { type: "movePointer", pointer: "left", to: indexRef(left) }, anchor: "move-left",
          explanation: `Move left to ${left}.`, variables: { i, left, right }, state: snapshot(v, ptrs()), highlights: hl(),
        });
      } else {
        right--;
        b.step({
          event: { type: "movePointer", pointer: "right", to: indexRef(right) }, anchor: "move-right",
          explanation: `Move right to ${right}.`, variables: { i, left, right }, state: snapshot(v, ptrs()), highlights: hl(),
        });
      }
    }
  }
  i = Math.max(0, n - 1);
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `Every i has been tried. There ${count === 1 ? "is" : "are"} ${count} distinct triplet${count === 1 ? "" : "s"} that sum to 0.`,
    variables: { count }, state: snapshot(v, {}), highlights: v.map((_, k) => cell(k, "visited")),
  });
  return b.build({ time: "O(n²)", space: "O(1)", result: count });
}

export const threeSumCount: AlgorithmDefinition<ThreeSumInput> = { id: ID, parseInput, run };
