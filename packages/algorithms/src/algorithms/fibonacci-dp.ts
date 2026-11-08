import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, snapshot } from "./array-common";
import { parseInts } from "./int-input";

export const ID = "fibonacci-dp";
export interface FibDpInput { readonly n: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<FibDpInput> {
  return parseInts(raw, limits, [{ name: "n", label: "n", min: 0, max: (l) => l.maxArrayLength - 1 }]) as InputResult<FibDpInput>;
}

export function run(input: FibDpInput, limits: LimitProfile): ExecutionTrace {
  const { n } = input;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { n }, maxSteps: limits.maxSteps });
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Compute Fibonacci(${n}) bottom-up. dp[i] will hold Fibonacci(i), and each entry is the sum of the two before it, so nothing is computed twice.`,
    variables: { n }, state: snapshot([], { i: null }),
  });
  if (n <= 1) {
    b.step({
      event: { type: "init" }, anchor: "base-case", explanation: `n is ${n}, so the answer is ${n} and no table is needed.`,
      variables: { n, result: n }, state: snapshot([], { i: null }),
    });
    return b.build({ time: "O(1)", space: "O(1)", result: n });
  }
  const dp: number[] = new Array<number>(n + 1).fill(0);
  dp[1] = 1;
  b.step({
    event: { type: "init" }, anchor: "init-table", explanation: "Make a table of n + 1 cells and set the starting values dp[0] = 0 and dp[1] = 1.",
    variables: { n }, state: snapshot(dp, { i: null }), highlights: [cell(0, "sorted", "base"), cell(1, "sorted", "base")],
  });
  for (let i = 2; i <= n; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop", explanation: `Fill cell ${i}.`,
      variables: { n, i }, state: snapshot(dp, { i }), highlights: [cell(i, "active", "i"), cell(i - 1, "compared"), cell(i - 2, "compared")],
    });
    dp[i] = dp[i - 1]! + dp[i - 2]!;
    b.step({
      event: { type: "assign", target: indexRef(i), value: dp[i]! }, anchor: "fill",
      explanation: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`,
      variables: { n, i, result: dp[i]! }, state: snapshot(dp, { i }), changed: [indexRef(i)],
      highlights: [cell(i, "created", "new"), cell(i - 1, "compared"), cell(i - 2, "compared")], motion: "appear",
    });
  }
  b.step({
    event: { type: "found", element: indexRef(n) }, anchor: "finish", explanation: `The last cell holds the answer: Fibonacci(${n}) = ${dp[n]}.`,
    variables: { n, result: dp[n]! }, state: snapshot(dp, { i: n }), highlights: [cell(n, "found", "answer")],
  });
  return b.build({ time: "O(n)", space: "O(n)", result: dp[n]! });
}

export const fibonacciDp: AlgorithmDefinition<FibDpInput> = { id: ID, parseInput, run };
