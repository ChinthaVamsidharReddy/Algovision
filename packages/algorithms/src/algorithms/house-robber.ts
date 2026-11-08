import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";

export const ID = "house-robber";
export interface RobberInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<RobberInput> {
  return parseArrayWithFields(raw, limits, { noun: "street", valueMin: 0, valueMessage: "Each house holds a whole number from 0 to 999." }) as InputResult<RobberInput>;
}

export function run(input: RobberInput, limits: LimitProfile): ExecutionTrace {
  const { values } = input;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values] }, maxSteps: limits.maxSteps });
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `The houses hold ${fmt(values)}. Rob the most money without robbing two neighbours. dp[i] is the best total using the first i houses.`,
    variables: { houses: n }, state: snapshot([], { i: null }),
  });
  if (n === 0) {
    b.step({ event: { type: "init" }, anchor: "base-case", explanation: "There are no houses, so the best total is 0.", variables: { result: 0 }, state: snapshot([], { i: null }) });
    return b.build({ time: "O(1)", space: "O(1)", result: 0 });
  }
  const dp: number[] = new Array<number>(n + 1).fill(0);
  dp[1] = values[0]!;
  b.step({
    event: { type: "init" }, anchor: "init-table", explanation: `dp[0] = 0 (no houses) and dp[1] = ${values[0]} (only the first house).`,
    variables: { houses: n }, state: snapshot(dp, { i: null }), highlights: [cell(0, "sorted", "base"), cell(1, "sorted", "base")],
  });
  for (let i = 2; i <= n; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop", explanation: `Decide the best total for the first ${i} houses. House ${i} holds ${values[i - 1]}.`,
      variables: { i, house: values[i - 1]! }, state: snapshot(dp, { i }), highlights: [cell(i, "active", "i")],
    });
    const take = dp[i - 2]! + values[i - 1]!;
    b.step({
      event: { type: "compare", a: indexRef(i - 2), b: indexRef(i - 1) }, anchor: "take",
      explanation: `Rob house ${i}: ${values[i - 1]} plus the best for the first ${i - 2} houses (${dp[i - 2]}) = ${take}.`,
      variables: { i, take }, state: snapshot(dp, { i }), highlights: [cell(i - 2, "compared", "take"), cell(i, "active", "i")],
    });
    const skip = dp[i - 1]!;
    b.step({
      event: { type: "compare", a: indexRef(i - 1), b: indexRef(i - 2) }, anchor: "skip",
      explanation: `Skip house ${i}: keep the best for the first ${i - 1} houses = ${skip}.`,
      variables: { i, take, skip }, state: snapshot(dp, { i }), highlights: [cell(i - 1, "compared", "skip"), cell(i, "active", "i")],
    });
    dp[i] = Math.max(take, skip);
    b.step({
      event: { type: "assign", target: indexRef(i), value: dp[i]! }, anchor: "fill",
      explanation: `The better choice is ${take >= skip ? "rob" : "skip"}: dp[${i}] = max(${take}, ${skip}) = ${dp[i]}.`,
      variables: { i, take, skip, result: dp[i]! }, state: snapshot(dp, { i }), changed: [indexRef(i)], highlights: [cell(i, "created", "new")], motion: "appear",
    });
  }
  b.step({
    event: { type: "found", element: indexRef(n) }, anchor: "finish", explanation: `The best total is ${dp[n]}.`,
    variables: { result: dp[n]! }, state: snapshot(dp, { i: n }), highlights: [cell(n, "found", "answer")],
  });
  return b.build({ time: "O(n)", space: "O(n)", result: dp[n]! });
}

export const houseRobber: AlgorithmDefinition<RobberInput> = { id: ID, parseInput, run };
