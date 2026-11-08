import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "counting-sort";
export const MAX_VALUE = 20;
export interface CountingSortInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<CountingSortInput> {
  return parseArrayWithFields(raw, limits, {
    valueMin: 0,
    valueMax: MAX_VALUE,
    valueMessage: `Counting sort needs whole numbers from 0 to ${MAX_VALUE}, because each value is used as an index into a count table.`,
  }) as InputResult<CountingSortInput>;
}

export function run(input: CountingSortInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const counts = new Array<number>(MAX_VALUE + 1).fill(0);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Sort ${fmt(arr)} without comparing values: count how many times each value from 0 to ${MAX_VALUE} appears, then write the values back in order.`,
    variables: {}, state: snapshot(arr, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-counts",
    explanation: `Create a table counts[0..${MAX_VALUE}], all zero.`,
    variables: {}, state: snapshot(arr, {}),
  });
  for (let i = 0; i < n; i++) {
    counts[arr[i]!]!++;
    b.step({
      event: { type: "visit", element: indexRef(i) }, anchor: "count",
      explanation: `Read ${arr[i]} at index ${i} and add 1 to counts[${arr[i]}], which is now ${counts[arr[i]!]}.`,
      variables: { i, value: arr[i]!, "counts[value]": counts[arr[i]!]! }, state: snapshot(arr, { i }),
      highlights: [...arr.slice(0, i).map((_, k) => cell(k, "visited")), cell(i, "active", "i")],
    });
  }
  let k = 0;
  for (let v = 0; v <= MAX_VALUE; v++) {
    b.step({
      event: { type: "init" }, anchor: "value-loop",
      explanation: counts[v] === 0 ? `Value ${v} appeared 0 times, so nothing to write.` : `Value ${v} appeared ${counts[v]} time${counts[v] === 1 ? "" : "s"}, so write it ${counts[v]} time${counts[v] === 1 ? "" : "s"}.`,
      variables: { v, "counts[v]": counts[v]!, k }, state: snapshot(arr, k < n ? { k } : {}),
      highlights: arr.map((_, t) => cell(t, t < k ? "sorted" : "visited")),
    });
    while (counts[v]! > 0) {
      arr[k] = v;
      counts[v]!--;
      k++;
      b.step({
        event: { type: "assign", target: indexRef(k - 1), value: v }, anchor: "write",
        explanation: `Write ${v} at index ${k - 1}. ${counts[v]} more ${v}${counts[v] === 1 ? "" : "s"} to write.`,
        variables: { v, "counts[v]": counts[v]!, k }, state: snapshot(arr, { k: ptr(k, n) }), changed: [indexRef(k - 1)],
        highlights: arr.map((_, t) => cell(t, t < k ? "sorted" : "visited")), motion: "appear",
      });
    }
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `The array is sorted: ${fmt(arr)}.`,
    variables: { k }, state: snapshot(arr, {}), highlights: arr.map((_, t) => cell(t, "sorted")),
  });
  return b.build({ time: "O(n + k)", space: "O(k)", result: arr });
}

export const countingSort: AlgorithmDefinition<CountingSortInput> = { id: ID, parseInput, run };
