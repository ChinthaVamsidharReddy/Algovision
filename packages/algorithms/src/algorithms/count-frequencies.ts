import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";

export const ID = "count-frequencies";
export interface CountFreqInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<CountFreqInput> {
  return parseArrayWithFields(raw, limits, { noun: "array" }) as InputResult<CountFreqInput>;
}

/** Result: value, count pairs flattened in order of first appearance: [v1, c1, v2, c2, ...]. */
export function run(input: CountFreqInput, limits: LimitProfile): ExecutionTrace {
  const { values } = input;
  const count = new Map<number, number>();
  const order: number[] = [];
  const firstAt = new Map<number, number>();
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values] }, maxSteps: limits.maxSteps });
  const mapText = () => (count.size === 0 ? "{}" : `{${order.map((v) => `${v}: ${count.get(v)}`).join(", ")}}`);
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Count how many times each value appears in ${fmt(values)} using a hash map from value to count. The answer lists value, count pairs in order of first appearance.`,
    variables: {}, state: snapshot(values, { i: null }),
  });
  b.step({ event: { type: "init" }, anchor: "init-map", explanation: "Start with an empty map and an empty list for the order values first appear.", variables: { distinct: 0 }, state: snapshot(values, { i: null }) });
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    const same = values.map((x, k) => (x === v && k < i ? k : -1)).filter((k) => k >= 0);
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop", explanation: `Look at position ${i}, value ${v}. Counts so far: ${mapText()}.`,
      variables: { i, value: v, distinct: order.length }, state: snapshot(values, { i }), highlights: [...same.map((k) => cell(k, "visited")), cell(i, "active", "i")],
    });
    if (!count.has(v)) {
      order.push(v);
      firstAt.set(v, i);
      b.step({
        event: { type: "visit", element: indexRef(i) }, anchor: "first-seen", explanation: `${v} has not been seen before, so remember it in the order list: ${fmt(order)}.`,
        variables: { i, value: v, distinct: order.length }, state: snapshot(values, { i }), highlights: [cell(i, "created", "new")],
      });
    }
    count.set(v, (count.get(v) ?? 0) + 1);
    b.step({
      event: { type: "visit", element: indexRef(i) }, anchor: "increment", explanation: `Add one to the count of ${v}. It is now ${count.get(v)}. Counts: ${mapText()}.`,
      variables: { i, value: v, count: count.get(v)!, distinct: order.length }, state: snapshot(values, { i }), highlights: [...same.map((k) => cell(k, "visited")), cell(i, "found", `count ${count.get(v)}`)],
    });
  }
  const result: number[] = [];
  for (const v of order) result.push(v, count.get(v)!);
  b.step({
    event: { type: "init" }, anchor: "build-output", explanation: `Write each value followed by its count, in order of first appearance: ${fmt(result)}.`,
    variables: { distinct: order.length }, state: snapshot(values, { i: null }), highlights: order.map((v) => cell(firstAt.get(v)!, "found", `${v} x${count.get(v)}`)),
  });
  b.step({ event: { type: "done" }, anchor: "finish", explanation: `Done. ${order.length} distinct value${order.length === 1 ? "" : "s"}.`, variables: { distinct: order.length }, state: snapshot(values, { i: null }) });
  return b.build({ time: "O(n)", space: "O(n)", result });
}

export const countFrequencies: AlgorithmDefinition<CountFreqInput> = { id: ID, parseInput, run };
