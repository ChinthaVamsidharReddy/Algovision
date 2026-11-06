import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "smallest-subarray-sum";
export interface SmallestSubarrayInput { readonly values: readonly number[]; readonly target: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<SmallestSubarrayInput> {
  return parseArrayWithFields(raw, limits, {
    valueMin: 1,
    valueMessage: `Each value must be a positive whole number up to ${limits.maxAbsValue}; the window only works when adding a value never lowers the sum.`,
    fields: [{ name: "target", label: "Target sum", min: () => 1, max: (_v, l) => l.maxAbsValue * l.maxArrayLength, rangeMessage: (_v, l) => `Target sum must be between 1 and ${l.maxAbsValue * l.maxArrayLength}.` }],
  }) as InputResult<SmallestSubarrayInput>;
}

export function run(input: SmallestSubarrayInput, limits: LimitProfile): ExecutionTrace {
  const { values, target } = input;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values], target }, maxSteps: limits.maxSteps });
  let left = 0;
  let sum = 0;
  let best = 0;
  let bestLeft = 0;
  const win = (right: number): Highlight[] => values.map((_, i) => cell(i, i >= left && i <= right ? "window" : "visited"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the shortest run of consecutive values in ${fmt(values)} whose sum is at least ${target}. The window grows on the right and shrinks from the left.`,
    variables: { target }, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-left",
    explanation: "Left edge of the window starts at index 0.", variables: { target, left }, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-sum",
    explanation: "The window sum starts at 0.", variables: { target, left, sum }, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-best",
    explanation: "best = 0 means no valid window has been found yet.", variables: { target, left, sum, best }, state: snapshot(values, {}),
  });
  for (let right = 0; right < n; right++) {
    b.step({
      event: { type: "movePointer", pointer: "right", to: indexRef(right) }, anchor: "expand",
      explanation: `Extend the window to include index ${right}.`,
      variables: { target, left, right, sum, best }, state: snapshot(values, { left, right }), highlights: win(right),
    });
    sum += values[right]!;
    b.step({
      event: { type: "assign", target: indexRef(right), value: sum }, anchor: "add",
      explanation: `Add ${values[right]}. The window sum is ${sum}.`,
      variables: { target, left, right, sum, best }, state: snapshot(values, { left, right }), highlights: [...win(right), cell(right, "active", "in")],
    });
    for (;;) {
      const enough = sum >= target;
      b.step({
        event: { type: "compare", a: indexRef(Math.min(left, right)), b: indexRef(right) }, anchor: "shrink-check",
        explanation: enough ? `${sum} >= ${target}: the window is big enough, so try to shrink it.` : `${sum} < ${target}: not enough yet, so extend the window further.`,
        variables: { target, left, right, sum, best }, state: snapshot(values, { left: left < n ? left : null, right }), highlights: win(right),
      });
      if (!enough) break;
      const length = right - left + 1;
      b.step({
        event: { type: "assign", target: indexRef(left), value: length }, anchor: "measure",
        explanation: `The window covers indexes ${left} to ${right}, so its length is ${length}.`,
        variables: { target, left, right, sum, best, length }, state: snapshot(values, { left, right }), highlights: win(right),
      });
      const better = best === 0 || length < best;
      b.step({
        event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "compare",
        explanation: better ? (best === 0 ? "This is the first valid window." : `${length} < ${best}, a shorter valid window.`) : `${length} >= ${best}, no improvement.`,
        variables: { target, left, right, sum, best, length }, state: snapshot(values, { left, right }), highlights: win(right),
      });
      if (better) {
        best = length;
        bestLeft = left;
        b.step({
          event: { type: "assign", target: indexRef(left), value: best }, anchor: "new-best",
          explanation: `Record ${best} as the shortest length.`,
          variables: { target, left, right, sum, best, length }, state: snapshot(values, { left, right }),
          highlights: values.map((_, i) => cell(i, i >= left && i <= right ? "found" : "visited")),
        });
      }
      const dropped = values[left]!;
      sum -= dropped;
      left++;
      b.step({
        event: { type: "movePointer", pointer: "left", to: left < n ? indexRef(left) : null }, anchor: "shrink",
        explanation: `Drop ${dropped} from the left. The sum is ${sum} and left moves to ${left}.`,
        variables: { target, left, right, sum, best }, state: snapshot(values, { left: left < n ? left : null, right }), highlights: win(right),
      });
    }
  }
  b.step({
    event: best > 0 ? { type: "found", element: indexRef(bestLeft) } : { type: "notFound" }, anchor: "finish",
    explanation: best > 0 ? `The shortest window with a sum of at least ${target} has length ${best}.` : `No window reaches ${target}, so the answer is 0.`,
    variables: { target, best }, state: snapshot(values, best > 0 ? { left: bestLeft, right: bestLeft + best - 1 } : {}),
    highlights: best > 0 ? values.map((_, i) => cell(i, i >= bestLeft && i < bestLeft + best ? "found" : "visited")) : [],
  });
  return b.build({ time: "O(n)", space: "O(1)", result: best });
}

export const smallestSubarraySum: AlgorithmDefinition<SmallestSubarrayInput> = { id: ID, parseInput, run };
