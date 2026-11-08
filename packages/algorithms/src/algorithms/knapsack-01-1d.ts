import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, snapshot } from "./array-common";

export const ID = "knapsack-01-1d";
export const MAX_CAPACITY = 20;
export const MAX_WEIGHT = 20;
export interface KnapsackInput { readonly values: readonly number[]; readonly capacity: number }

/** values holds items as consecutive pairs: weight, value, weight, value, ... */
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<KnapsackInput> {
  const p = parseArrayWithFields(raw, limits, {
    noun: "item list", valueMin: 0, valueMax: 999, valueMessage: "Item numbers must be whole numbers from 0 to 999.",
    fields: [{ name: "capacity", label: "Capacity", min: () => 0, max: () => MAX_CAPACITY, rangeMessage: () => `Capacity must be between 0 and ${MAX_CAPACITY}.` }],
  }) as InputResult<KnapsackInput>;
  if (!p.ok) return p;
  const errors: FieldError[] = [];
  const v = p.value.values;
  if (v.length % 2 !== 0) errors.push({ field: "values", message: "Enter items as pairs: weight, value, weight, value, ..." });
  else if (v.some((x, i) => i % 2 === 0 && (x < 1 || x > MAX_WEIGHT))) errors.push({ field: "values", message: `Each weight (every first number of a pair) must be from 1 to ${MAX_WEIGHT}.` });
  return errors.length > 0 ? { ok: false, errors } : p;
}

/** dp[c] = best total value with capacity c. Capacities are scanned downwards so each item is used at most once. */
export function run(input: KnapsackInput, limits: LimitProfile): ExecutionTrace {
  const { values: items, capacity } = input;
  const dp: number[] = new Array<number>(capacity + 1).fill(0);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...items], capacity }, maxSteps: limits.maxSteps });
  const pairs = Array.from({ length: items.length / 2 }, (_, k) => `(weight ${items[2 * k]}, value ${items[2 * k + 1]})`).join(", ");
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Pick items to maximise total value without exceeding capacity ${capacity}; each item can be used once. Items: ${pairs || "none"}. dp[c] is the best value that fits in capacity c.`,
    variables: { capacity }, state: snapshot([], { c: null }),
  });
  b.step({
    event: { type: "init" }, anchor: "init-table", explanation: "With no items yet, every capacity holds value 0.", variables: { capacity }, state: snapshot(dp, { c: null }),
  });
  for (let k = 0; k < items.length; k += 2) {
    const weight = items[k]!;
    const value = items[k + 1]!;
    b.step({
      event: { type: "init" }, anchor: "loop", explanation: `Now consider item ${k / 2 + 1}: weight ${weight}, value ${value}.`,
      variables: { weight, value }, state: snapshot(dp, { c: null }),
    });
    for (let c = capacity; c >= weight; c--) {
      b.step({
        event: { type: "movePointer", pointer: "c", to: indexRef(c) }, anchor: "inner-loop",
        explanation: `Capacity ${c}: compare leaving the item out (dp[${c}] = ${dp[c]}) with taking it (dp[${c - weight}] + ${value} = ${dp[c - weight]! + value}). We scan downwards so this item is not counted twice.`,
        variables: { weight, value, c }, state: snapshot(dp, { c }), highlights: [cell(c, "active", "c"), cell(c - weight, "compared", "c - weight")],
      });
      const take = dp[c - weight]! + value;
      const better = take > dp[c]!;
      b.step({
        event: { type: "compare", a: indexRef(c - weight), b: indexRef(c) }, anchor: "check",
        explanation: better ? `Taking the item gives ${take}, better than ${dp[c]}.` : `Taking the item gives ${take}, not better than ${dp[c]}. Keep it.`,
        variables: { weight, value, c }, state: snapshot(dp, { c }), highlights: [cell(c, "active", "c"), cell(c - weight, better ? "found" : "compared", "c - weight")],
      });
      if (better) {
        dp[c] = take;
        b.step({
          event: { type: "assign", target: indexRef(c), value: take }, anchor: "fill", explanation: `dp[${c}] = ${take}.`,
          variables: { weight, value, c, result: take }, state: snapshot(dp, { c }), changed: [indexRef(c)], highlights: [cell(c, "created", "new")], motion: "appear",
        });
      }
    }
  }
  b.step({
    event: { type: "found", element: indexRef(capacity) }, anchor: "finish", explanation: `The best total value with capacity ${capacity} is ${dp[capacity]}.`,
    variables: { result: dp[capacity]! }, state: snapshot(dp, { c: capacity }), highlights: [cell(capacity, "found", "answer")],
  });
  return b.build({ time: "O(items * capacity)", space: "O(capacity)", result: dp[capacity]! });
}

export const knapsack01d: AlgorithmDefinition<KnapsackInput> = { id: ID, parseInput, run };
