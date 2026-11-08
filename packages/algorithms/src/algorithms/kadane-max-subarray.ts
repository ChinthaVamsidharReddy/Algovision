import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "kadane-max-subarray";
export interface KadaneInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<KadaneInput> {
  return parseArrayWithFields(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one value." }) as InputResult<KadaneInput>;
}

export function run(input: KadaneInput, limits: LimitProfile): ExecutionTrace {
  const values = input.values;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values] }, maxSteps: limits.maxSteps });
  let current = values[0]!;
  let best = values[0]!;
  let start = 0;
  let bestStart = 0;
  let bestEnd = 0;
  const view = (end: number, extra: Highlight[] = []): Highlight[] => [...values.map((_, k) => cell(k, k >= start && k <= end ? "window" : "visited")), ...extra];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the largest sum of any run of consecutive values in ${fmt(values)}. At each value, either extend the current run or start a new one.`,
    variables: {}, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init",
    explanation: `Start with the first value, ${current}, as both the current run and the best run.`,
    variables: { current, best }, state: snapshot(values, {}), highlights: view(0),
  });
  for (let i = 1; i < n; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop",
      explanation: `Look at index ${i}, which holds ${values[i]}.`,
      variables: { i, current, best }, state: snapshot(values, { i }), highlights: view(i - 1, [cell(i, "active", "i")]),
    });
    const restart = current < 0;
    b.step({
      event: { type: "compare", a: indexRef(i - 1), b: indexRef(i) }, anchor: "decide",
      explanation: restart ? `The current run sums to ${current}, which is negative. It can only drag a new run down, so drop it.` : `The current run sums to ${current}, which is not negative, so it helps. Keep extending it.`,
      variables: { i, current, best }, state: snapshot(values, { i }), highlights: view(i - 1, [cell(i, "compared")]),
    });
    if (restart) {
      current = values[i]!;
      start = i;
      b.step({
        event: { type: "assign", target: indexRef(i), value: current }, anchor: "restart",
        explanation: `Start a new run at index ${i}: current = ${current}.`,
        variables: { i, current, best }, state: snapshot(values, { i }), highlights: view(i, [cell(i, "active", "start")]),
      });
    } else {
      current += values[i]!;
      b.step({
        event: { type: "assign", target: indexRef(i), value: current }, anchor: "extend",
        explanation: `Extend the run to include ${values[i]}: current = ${current}.`,
        variables: { i, current, best }, state: snapshot(values, { i }), highlights: view(i),
      });
    }
    const better = current > best;
    if (better) {
      best = current;
      bestStart = start;
      bestEnd = i;
    }
    b.step({
      event: { type: "compare", a: indexRef(start), b: indexRef(i) }, anchor: "update-best",
      explanation: better ? `${current} beats the old best, so best = ${best}.` : `${current} does not beat the best, ${best}.`,
      variables: { i, current, best }, state: snapshot(values, { i }), highlights: view(i, better ? [cell(i, "found", "best")] : []),
    });
  }
  b.step({
    event: { type: "found", element: indexRef(bestStart) }, anchor: "finish",
    explanation: `The best run is indexes ${bestStart} to ${bestEnd}, with sum ${best}.`,
    variables: { best }, state: snapshot(values, { start: bestStart, end: bestEnd }),
    highlights: values.map((_, k) => cell(k, k >= bestStart && k <= bestEnd ? "found" : "visited")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: best });
}

export const kadaneMaxSubarray: AlgorithmDefinition<KadaneInput> = { id: ID, parseInput, run };
