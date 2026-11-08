import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, snapshot } from "./array-common";
import { parseInts } from "./int-input";

export const ID = "climbing-stairs";
export interface StairsInput { readonly n: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<StairsInput> {
  return parseInts(raw, limits, [{ name: "n", label: "Number of stairs", min: 1, max: (l) => l.maxArrayLength - 1 }]) as InputResult<StairsInput>;
}

export function run(input: StairsInput, limits: LimitProfile): ExecutionTrace {
  const { n } = input;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { n }, maxSteps: limits.maxSteps });
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Count the ways to climb ${n} stair${n === 1 ? "" : "s"} taking 1 or 2 steps at a time. dp[i] is the number of ways to reach stair i; the last move was either from stair i - 1 or from stair i - 2.`,
    variables: { n }, state: snapshot([], { i: null }),
  });
  if (n <= 2) {
    b.step({
      event: { type: "init" }, anchor: "base-case", explanation: `With ${n} stair${n === 1 ? "" : "s"} there ${n === 1 ? "is 1 way" : "are 2 ways (1+1 or 2)"}, so no table is needed.`,
      variables: { n, result: n }, state: snapshot([], { i: null }),
    });
    return b.build({ time: "O(1)", space: "O(1)", result: n });
  }
  const dp: number[] = new Array<number>(n + 1).fill(0);
  dp[1] = 1;
  dp[2] = 2;
  b.step({
    event: { type: "init" }, anchor: "init-table", explanation: "Stair 0 is unused. dp[1] = 1 way and dp[2] = 2 ways (1+1 or 2).",
    variables: { n }, state: snapshot(dp, { i: null }), highlights: [cell(1, "sorted", "base"), cell(2, "sorted", "base")],
  });
  for (let i = 3; i <= n; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop", explanation: `Work out the ways to reach stair ${i}.`,
      variables: { n, i }, state: snapshot(dp, { i }), highlights: [cell(i, "active", "i"), cell(i - 1, "compared"), cell(i - 2, "compared")],
    });
    dp[i] = dp[i - 1]! + dp[i - 2]!;
    b.step({
      event: { type: "assign", target: indexRef(i), value: dp[i]! }, anchor: "fill",
      explanation: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}: every way to reach stair ${i - 1} plus every way to reach stair ${i - 2}.`,
      variables: { n, i, result: dp[i]! }, state: snapshot(dp, { i }), changed: [indexRef(i)],
      highlights: [cell(i, "created", "new"), cell(i - 1, "compared"), cell(i - 2, "compared")], motion: "appear",
    });
  }
  b.step({
    event: { type: "found", element: indexRef(n) }, anchor: "finish", explanation: `There are ${dp[n]} ways to climb ${n} stairs.`,
    variables: { n, result: dp[n]! }, state: snapshot(dp, { i: n }), highlights: [cell(n, "found", "answer")],
  });
  return b.build({ time: "O(n)", space: "O(n)", result: dp[n]! });
}

export const climbingStairs: AlgorithmDefinition<StairsInput> = { id: ID, parseInput, run };
