import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "longest-subarray-sum-at-most";
export interface LongestAtMostInput { readonly values: readonly number[]; readonly target: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<LongestAtMostInput> {
  return parseArrayWithFields(raw, limits, {
    valueMin: 1,
    valueMessage: `Each value must be a positive whole number up to ${limits.maxAbsValue}; the window only works when adding a value never lowers the sum.`,
    fields: [{ name: "target", label: "Maximum sum", min: () => 0, max: (_v, l) => l.maxAbsValue * l.maxArrayLength, rangeMessage: (_v, l) => `Maximum sum must be between 0 and ${l.maxAbsValue * l.maxArrayLength}.` }],
  }) as InputResult<LongestAtMostInput>;
}

export function run(input: LongestAtMostInput, limits: LimitProfile): ExecutionTrace {
  const { values: v, target } = input;
  const n = v.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...v], target }, maxSteps: limits.maxSteps });
  let left = 0;
  let sum = 0;
  let best = 0;
  let bestLeft = 0;
  const win = (right: number, extra: Highlight[] = []): Highlight[] => [...v.map((_, t) => cell(t, t >= left && t <= right ? "window" : "visited")), ...extra];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the longest run of consecutive values in ${fmt(v)} whose sum is at most ${target}. The window grows on the right and shrinks from the left whenever the sum gets too big.`,
    variables: { target }, state: snapshot(v, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init", explanation: "left = 0, sum = 0, best = 0.", variables: { left, sum, best, target }, state: snapshot(v, {}),
  });
  for (let right = 0; right < n; right++) {
    sum += v[right]!;
    b.step({
      event: { type: "movePointer", pointer: "right", to: indexRef(right) }, anchor: "add",
      explanation: `Add ${v[right]} from index ${right}. The window sum is ${sum}.`,
      variables: { left, right, sum, best }, state: snapshot(v, { left: ptr(left, n), right }), highlights: win(right, [cell(right, "active", "in")]),
    });
    for (;;) {
      const over = sum > target;
      b.step({
        event: { type: "compare", a: indexRef(Math.min(left, right)), b: indexRef(right) }, anchor: "shrink-check",
        explanation: over ? `${sum} > ${target}: too big, so drop values from the left.` : `${sum} <= ${target}: the window is allowed.`,
        variables: { left, right, sum, target }, state: snapshot(v, { left: ptr(left, n), right }), highlights: win(right),
      });
      if (!over) break;
      const dropped = v[left]!;
      sum -= dropped;
      left++;
      b.step({
        event: { type: "movePointer", pointer: "left", to: left < n ? indexRef(left) : null }, anchor: "shrink",
        explanation: `Drop ${dropped} from the left. The sum is ${sum} and left moves to ${left}.`,
        variables: { left, right, sum }, state: snapshot(v, { left: ptr(left, n), right }), highlights: win(right),
      });
    }
    const len = right - left + 1;
    b.step({
      event: { type: "assign", target: indexRef(right), value: len }, anchor: "measure",
      explanation: len > 0 ? `The window covers indexes ${left} to ${right}, length ${len}.` : "The window is empty (even this single value is too big), length 0.",
      variables: { left, right, len, best }, state: snapshot(v, { left: ptr(left, n), right }), highlights: win(right),
    });
    const better = len > best;
    if (better) {
      best = len;
      bestLeft = left;
    }
    b.step({
      event: { type: "compare", a: indexRef(Math.min(left, right)), b: indexRef(right) }, anchor: "update-best",
      explanation: better ? `${len} is longer than before, so best = ${best}.` : `${len} does not beat ${best}.`,
      variables: { left, right, len, best }, state: snapshot(v, { left: ptr(left, n), right }), highlights: win(right, better ? [cell(right, "found")] : []),
    });
  }
  b.step({
    event: best > 0 ? { type: "found", element: indexRef(bestLeft) } : { type: "notFound" }, anchor: "finish",
    explanation: best > 0 ? `The longest window with sum at most ${target} has length ${best} (indexes ${bestLeft} to ${bestLeft + best - 1}).` : `No value fits within ${target}, so the answer is 0.`,
    variables: { best }, state: snapshot(v, {}), highlights: v.map((_, t) => cell(t, t >= bestLeft && t < bestLeft + best ? "found" : "visited")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: best });
}

export const longestSubarraySumAtMost: AlgorithmDefinition<LongestAtMostInput> = { id: ID, parseInput, run };
