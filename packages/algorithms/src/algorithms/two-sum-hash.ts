import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";

export const ID = "two-sum-hash";
export interface TwoSumHashInput { readonly values: readonly number[]; readonly target: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<TwoSumHashInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "array",
    fields: [{ name: "target", label: "Target sum", min: (_v, l) => -2 * l.maxAbsValue, max: (_v, l) => 2 * l.maxAbsValue, rangeMessage: (_v, l) => `Target sum must be between ${-2 * l.maxAbsValue} and ${2 * l.maxAbsValue}.` }],
  }) as InputResult<TwoSumHashInput>;
}

/** Result: [i, j] with i < j and values[i] + values[j] = target (i is the latest earlier index holding the needed value), or []. */
export function run(input: TwoSumHashInput, limits: LimitProfile): ExecutionTrace {
  const { values, target } = input;
  const n = values.length;
  const seen = new Map<number, number>();
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values], target }, maxSteps: limits.maxSteps });
  const mapText = () => (seen.size === 0 ? "{}" : `{${[...seen].map(([v, i]) => `${v}: ${i}`).join(", ")}}`);
  const mark = (extra: ReturnType<typeof cell>[] = []) => [...[...seen.values()].map((i) => cell(i, "visited")), ...extra];
  const withoutIndex = (extra: ReturnType<typeof cell>[]) => {
    const taken = new Set(extra.map((h) => (h.target.kind === "index" ? h.target.index : -1)));
    return [...[...seen.values()].filter((i) => !taken.has(i)).map((i) => cell(i, "visited")), ...extra];
  };
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find two positions in ${fmt(values)} whose values add up to ${target}. A hash map remembers each value we have passed and where it was, so the partner can be found instantly.`,
    variables: { target }, state: snapshot(values, { j: null }),
  });
  b.step({
    event: { type: "init" }, anchor: "init-map", explanation: "Start with an empty map from value to position.", variables: { target, seen: 0 }, state: snapshot(values, { j: null }),
  });
  for (let j = 0; j < n; j++) {
    const v = values[j]!;
    b.step({
      event: { type: "movePointer", pointer: "j", to: indexRef(j) }, anchor: "loop", explanation: `Look at position ${j}, value ${v}. Map so far: ${mapText()}.`,
      variables: { j, value: v, seen: seen.size }, state: snapshot(values, { j }), highlights: withoutIndex([cell(j, "active", "j")]),
    });
    const need = target - v;
    b.step({
      event: { type: "init" }, anchor: "compute-complement", explanation: `To reach ${target} with ${v}, we need ${need}.`,
      variables: { j, value: v, need, seen: seen.size }, state: snapshot(values, { j }), highlights: withoutIndex([cell(j, "active", "j")]),
    });
    const hit = seen.get(need);
    b.step({
      event: { type: "visit", element: indexRef(j) }, anchor: "check-seen",
      explanation: hit !== undefined ? `${need} is in the map (position ${hit}), so we have a pair.` : `${need} is not in the map yet.`,
      variables: { j, value: v, need, seen: seen.size }, state: snapshot(values, { j }),
      highlights: withoutIndex(hit !== undefined ? [cell(hit, "found", "partner"), cell(j, "active", "j")] : [cell(j, "compared", "j")]),
    });
    if (hit !== undefined) {
      b.step({
        event: { type: "found", element: indexRef(j) }, anchor: "found", explanation: `Positions ${hit} and ${j} hold ${values[hit]} and ${v}, which add up to ${target}.`,
        variables: { i: hit, j, value: v }, state: snapshot(values, { j }), highlights: [cell(hit, "found", "i"), cell(j, "found", "j")],
      });
      return b.build({ time: "O(n)", space: "O(n)", result: [hit, j] });
    }
    seen.set(v, j);
    b.step({
      event: { type: "visit", element: indexRef(j) }, anchor: "store", explanation: `Remember ${v} at position ${j}. Map: ${mapText()}.`,
      variables: { j, value: v, seen: seen.size }, state: snapshot(values, { j }), highlights: mark(),
    });
  }
  b.step({
    event: { type: "notFound" }, anchor: "not-found", explanation: `No two values add up to ${target}.`, variables: { target, seen: seen.size }, state: snapshot(values, { j: null }), highlights: mark(),
  });
  return b.build({ time: "O(n)", space: "O(n)", result: [] });
}

export const twoSumHash: AlgorithmDefinition<TwoSumHashInput> = { id: ID, parseInput, run };
