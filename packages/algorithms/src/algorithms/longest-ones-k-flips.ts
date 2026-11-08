import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "longest-ones-k-flips";
export interface LongestOnesInput { readonly values: readonly number[]; readonly k: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<LongestOnesInput> {
  return parseArrayWithFields(raw, limits, {
    valueMin: 0, valueMax: 1, valueMessage: "Each value must be 0 or 1.",
    fields: [{ name: "k", label: "Flips allowed (k)", min: () => 0, max: (v) => v.length, rangeMessage: (v) => `Flips allowed (k) must be between 0 and ${v.length}.` }],
  }) as InputResult<LongestOnesInput>;
}

export function run(input: LongestOnesInput, limits: LimitProfile): ExecutionTrace {
  const { values: v, k } = input;
  const n = v.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...v], k }, maxSteps: limits.maxSteps });
  let left = 0;
  let zeros = 0;
  let best = 0;
  let bestLeft = 0;
  const win = (right: number, extra: Highlight[] = []): Highlight[] => [...v.map((x, t) => cell(t, t >= left && t <= right ? "window" : "visited", t >= left && t <= right && x === 0 ? "0" : undefined)), ...extra];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the longest run of 1s in ${fmt(v)} if up to ${k} zero${k === 1 ? "" : "s"} may be flipped to 1. That is the longest window containing at most ${k} zero${k === 1 ? "" : "s"}.`,
    variables: { k }, state: snapshot(v, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init",
    explanation: "left = 0, zeros = 0 (zeros inside the window), best = 0.", variables: { left, zeros, best, k }, state: snapshot(v, {}),
  });
  for (let right = 0; right < n; right++) {
    b.step({
      event: { type: "movePointer", pointer: "right", to: indexRef(right) }, anchor: "expand",
      explanation: `Extend the window to include index ${right} (value ${v[right]}).`,
      variables: { left, right, zeros, best }, state: snapshot(v, { left, right }), highlights: win(right),
    });
    if (v[right] === 0) zeros++;
    b.step({
      event: { type: "compare", a: indexRef(right), b: indexRef(right) }, anchor: "count-zero",
      explanation: v[right] === 0 ? `It is a 0, so the window now holds ${zeros} zero${zeros === 1 ? "" : "s"}.` : `It is a 1, so the zero count stays ${zeros}.`,
      variables: { left, right, zeros }, state: snapshot(v, { left, right }), highlights: win(right),
    });
    for (;;) {
      const over = zeros > k;
      b.step({
        event: { type: "compare", a: indexRef(Math.min(left, right)), b: indexRef(right) }, anchor: "shrink-check",
        explanation: over ? `${zeros} zeros is more than the ${k} allowed, so shrink the window from the left.` : `${zeros} zeros is within the ${k} allowed.`,
        variables: { left, right, zeros, k }, state: snapshot(v, { left: ptr(left, n), right }), highlights: win(right),
      });
      if (!over) break;
      const dropped = v[left]!;
      if (dropped === 0) zeros--;
      left++;
      b.step({
        event: { type: "movePointer", pointer: "left", to: left < n ? indexRef(left) : null }, anchor: "drop",
        explanation: dropped === 0 ? `Drop a 0 from the left: zeros is now ${zeros}.` : "Drop a 1 from the left; the zero count is unchanged.",
        variables: { left, right, zeros }, state: snapshot(v, { left: ptr(left, n), right }), highlights: win(right),
      });
    }
    const len = right - left + 1;
    b.step({
      event: { type: "assign", target: indexRef(right), value: len }, anchor: "measure",
      explanation: `The window covers indexes ${left} to ${right}, length ${len}.`,
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
    explanation: best > 0 ? `The longest window has length ${best} (indexes ${bestLeft} to ${bestLeft + best - 1}).` : "The array is empty, so the answer is 0.",
    variables: { best }, state: snapshot(v, {}), highlights: v.map((_, t) => cell(t, t >= bestLeft && t < bestLeft + best ? "found" : "visited")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: best });
}

export const longestOnesKFlips: AlgorithmDefinition<LongestOnesInput> = { id: ID, parseInput, run };
