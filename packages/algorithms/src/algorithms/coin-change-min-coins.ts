import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";

export const ID = "coin-change-min-coins";
export const MAX_AMOUNT = 20;
export interface CoinInput { readonly values: readonly number[]; readonly amount: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<CoinInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "coin list", valueMin: 1, valueMax: 99, valueMessage: "Each coin must be a whole number from 1 to 99.",
    fields: [{ name: "amount", label: "Amount", min: () => 0, max: () => MAX_AMOUNT, rangeMessage: () => `Amount must be between 0 and ${MAX_AMOUNT}.` }],
  }) as InputResult<CoinInput>;
}

/** dp[a] = fewest coins that make a; amount + 1 stands for "impossible". Result: dp[amount] or -1. */
export function run(input: CoinInput, limits: LimitProfile): ExecutionTrace {
  const { values: coins, amount } = input;
  const INF = amount + 1;
  const dp: number[] = new Array<number>(amount + 1).fill(INF);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...coins], amount }, maxSteps: limits.maxSteps });
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the fewest coins from ${fmt(coins)} that add up to ${amount}. dp[a] is the fewest coins for amount a; ${INF} (amount + 1) means "not possible yet".`,
    variables: { amount }, state: snapshot([], { a: null }),
  });
  dp[0] = 0;
  b.step({
    event: { type: "init" }, anchor: "init-table", explanation: `Every amount starts at ${INF} (impossible), except dp[0] = 0: zero coins make 0.`,
    variables: { amount }, state: snapshot(dp, { a: null }), highlights: [cell(0, "sorted", "base")],
  });
  for (let a = 1; a <= amount; a++) {
    b.step({
      event: { type: "movePointer", pointer: "a", to: indexRef(a) }, anchor: "loop", explanation: `Find the fewest coins for amount ${a}.`,
      variables: { a }, state: snapshot(dp, { a, from: null }), highlights: [cell(a, "active", "a")],
    });
    for (const coin of coins) {
      const from = a - coin;
      b.step({
        event: { type: "init" }, anchor: "try-coin", explanation: from >= 0 ? `Try a coin of ${coin}. The rest, ${a} - ${coin} = ${from}, needs dp[${from}] = ${dp[from] === INF ? "impossible" : dp[from]} coins.` : `A coin of ${coin} is bigger than ${a}, so it cannot be used.`,
        variables: { a, coin }, state: snapshot(dp, { a, from: from >= 0 ? from : null }), highlights: from >= 0 ? [cell(a, "active", "a"), cell(from, "compared", "from")] : [cell(a, "active", "a")],
      });
      if (from < 0) continue;
      const better = dp[from]! + 1 < dp[a]!;
      b.step({
        event: { type: "compare", a: indexRef(from), b: indexRef(a) }, anchor: "check",
        explanation: better ? `dp[${from}] + 1 = ${dp[from]! + 1} is fewer than dp[${a}] = ${dp[a]}, so this coin helps.` : `dp[${from}] + 1 = ${dp[from]! + 1} is not fewer than dp[${a}] = ${dp[a]}. Keep it.`,
        variables: { a, coin }, state: snapshot(dp, { a, from }), highlights: [cell(a, "active", "a"), cell(from, better ? "found" : "compared", "from")],
      });
      if (better) {
        dp[a] = dp[from]! + 1;
        b.step({
          event: { type: "assign", target: indexRef(a), value: dp[a]! }, anchor: "fill", explanation: `dp[${a}] = ${dp[a]}.`,
          variables: { a, coin, result: dp[a]! }, state: snapshot(dp, { a, from }), changed: [indexRef(a)], highlights: [cell(a, "created", "new"), cell(from, "compared", "from")], motion: "appear",
        });
      }
    }
  }
  const result = dp[amount]! > amount ? -1 : dp[amount]!;
  b.step({
    event: result === -1 ? { type: "notFound" } : { type: "found", element: indexRef(amount) }, anchor: "finish",
    explanation: result === -1 ? `dp[${amount}] is still ${INF}, so ${amount} cannot be made. The answer is -1.` : `dp[${amount}] = ${result}: the fewest coins is ${result}.`,
    variables: { amount, result }, state: snapshot(dp, { a: amount }), highlights: result === -1 ? [] : [cell(amount, "found", "answer")],
  });
  return b.build({ time: "O(amount * coins)", space: "O(amount)", result });
}

export const coinChangeMinCoins: AlgorithmDefinition<CoinInput> = { id: ID, parseInput, run };
