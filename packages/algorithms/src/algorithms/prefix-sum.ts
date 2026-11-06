import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "prefix-sum";
export interface PrefixSumInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<PrefixSumInput> {
  return parseArrayWithFields(raw, limits, {}) as InputResult<PrefixSumInput>;
}

export function run(input: PrefixSumInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  const done = (upTo: number): Highlight[] => Array.from({ length: Math.max(0, upTo) }, (_, k) => cell(k, "sorted"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Turn ${fmt(arr)} into running totals, so that index i ends up holding the sum of everything from index 0 to i.`,
    variables: {}, state: snapshot(arr, {}),
  });
  for (let i = 1; i < n; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop",
      explanation: `Move to index ${i}. Index ${i - 1} already holds the total so far, ${arr[i - 1]}.`,
      variables: { i }, state: snapshot(arr, { i }),
      highlights: [...done(i), cell(i, "active", "i")],
    });
    const before = arr[i]!;
    const prev = arr[i - 1]!;
    const total = prev + before;
    arr[i] = total;
    b.step({
      event: { type: "assign", target: indexRef(i), value: total }, anchor: "accumulate",
      explanation: `Add the previous total to this value: ${prev} + ${before} = ${total}.`,
      variables: { i, total }, state: snapshot(arr, { i }), changed: [indexRef(i)],
      highlights: [...done(i), cell(i, "found", "total")], motion: "appear",
    });
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `Done. The running totals are ${fmt(arr)}. The sum of any range i..j is now prefix[j] - prefix[i-1].`,
    variables: {}, state: snapshot(arr, {}), highlights: done(n),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: arr });
}

export const prefixSum: AlgorithmDefinition<PrefixSumInput> = { id: ID, parseInput, run };
