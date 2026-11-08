import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";

export const ID = "longest-increasing-subsequence";
export interface LisInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<LisInput> {
  return parseArrayWithFields(raw, limits, { noun: "array" }) as InputResult<LisInput>;
}

/** dp[i] = length of the longest strictly increasing subsequence that ends at position i. */
export function run(input: LisInput, limits: LimitProfile): ExecutionTrace {
  const { values } = input;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values] }, maxSteps: limits.maxSteps });
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the length of the longest strictly increasing subsequence of ${fmt(values)}. dp[i] is the longest one that ends at position i.`,
    variables: { n }, state: snapshot([], { i: null, j: null }),
  });
  if (n === 0) {
    b.step({ event: { type: "init" }, anchor: "base-case", explanation: "The array is empty, so the answer is 0.", variables: { best: 0 }, state: snapshot([], { i: null, j: null }) });
    return b.build({ time: "O(1)", space: "O(1)", result: 0 });
  }
  const dp: number[] = new Array<number>(n).fill(1);
  let best = 1;
  b.step({
    event: { type: "init" }, anchor: "init-table", explanation: "Every value alone is an increasing subsequence of length 1, so every dp cell starts at 1. The table is indexed like the array.",
    variables: { n, best }, state: snapshot(dp, { i: null, j: null }),
  });
  for (let i = 1; i < n; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop", explanation: `Find the longest increasing subsequence ending at position ${i}, value ${values[i]}.`,
      variables: { i, value: values[i]!, best }, state: snapshot(dp, { i, j: null }), highlights: [cell(i, "active", "i")],
    });
    for (let j = 0; j < i; j++) {
      b.step({
        event: { type: "movePointer", pointer: "j", to: indexRef(j) }, anchor: "inner-loop", explanation: `Consider the earlier value ${values[j]} at position ${j} as the previous element.`,
        variables: { i, j, value: values[i]!, best }, state: snapshot(dp, { i, j }), highlights: [cell(i, "active", "i"), cell(j, "compared", "j")],
      });
      const smaller = values[j]! < values[i]!;
      const better = smaller && dp[j]! + 1 > dp[i]!;
      b.step({
        event: { type: "compare", a: indexRef(j), b: indexRef(i) }, anchor: "check",
        explanation: !smaller ? `${values[j]} is not smaller than ${values[i]}, so it cannot come before it.` : better ? `${values[j]} < ${values[i]} and dp[${j}] + 1 = ${dp[j]! + 1} beats dp[${i}] = ${dp[i]}.` : `${values[j]} < ${values[i]}, but dp[${j}] + 1 = ${dp[j]! + 1} does not beat dp[${i}] = ${dp[i]}.`,
        variables: { i, j, best }, state: snapshot(dp, { i, j }), highlights: [cell(i, "active", "i"), cell(j, better ? "found" : "compared", "j")],
      });
      if (better) {
        dp[i] = dp[j]! + 1;
        b.step({
          event: { type: "assign", target: indexRef(i), value: dp[i]! }, anchor: "fill", explanation: `dp[${i}] = ${dp[i]}.`,
          variables: { i, j, best, result: dp[i]! }, state: snapshot(dp, { i, j }), changed: [indexRef(i)], highlights: [cell(i, "created", "new"), cell(j, "compared", "j")], motion: "appear",
        });
      }
    }
    if (dp[i]! > best) best = dp[i]!;
    b.step({
      event: { type: "init" }, anchor: "update-best", explanation: `The best length so far is ${best}.`,
      variables: { i, best }, state: snapshot(dp, { i, j: null }), highlights: [cell(i, "active", "i")],
    });
  }
  b.step({
    event: { type: "done" }, anchor: "finish", explanation: `The longest increasing subsequence has length ${best}.`,
    variables: { best }, state: snapshot(dp, { i: null, j: null }), highlights: dp.map((v, k) => (v === best ? cell(k, "found") : null)).filter((h): h is ReturnType<typeof cell> => h !== null),
  });
  return b.build({ time: "O(n^2)", space: "O(n)", result: best });
}

export const longestIncreasingSubsequence: AlgorithmDefinition<LisInput> = { id: ID, parseInput, run };
