import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";

export const ID = "first-repeating-element";
export const MAX_VALUE = 999;
export interface FirstRepeatInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<FirstRepeatInput> {
  return parseArrayWithFields(raw, limits, { noun: "array", valueMin: 0, valueMax: MAX_VALUE, valueMessage: `Values must be whole numbers from 0 to ${MAX_VALUE}.` }) as InputResult<FirstRepeatInput>;
}

/** Result: the value whose repeat shows up earliest, or -1 if all values are distinct. */
export function run(input: FirstRepeatInput, limits: LimitProfile): ExecutionTrace {
  const { values } = input;
  const seen = new Set<number>();
  const firstAt = new Map<number, number>();
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values] }, maxSteps: limits.maxSteps });
  const setText = () => `{${[...seen].join(", ")}}`;
  const marks = (extra: ReturnType<typeof cell>[] = []) => {
    const taken = new Set(extra.map((h) => (h.target.kind === "index" ? h.target.index : -1)));
    return [...[...firstAt.values()].filter((i) => !taken.has(i)).map((i) => cell(i, "visited")), ...extra];
  };
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the first value in ${fmt(values)} that has already appeared earlier. A hash set remembers the values seen so far and answers "seen it?" instantly.`,
    variables: {}, state: snapshot(values, { i: null }),
  });
  b.step({ event: { type: "init" }, anchor: "init-set", explanation: "Start with an empty set.", variables: { seen: 0 }, state: snapshot(values, { i: null }) });
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop", explanation: `Look at position ${i}, value ${v}. Set so far: ${setText()}.`,
      variables: { i, value: v, seen: seen.size }, state: snapshot(values, { i }), highlights: marks([cell(i, "active", "i")]),
    });
    const dup = seen.has(v);
    b.step({
      event: { type: "visit", element: indexRef(i) }, anchor: "check-seen",
      explanation: dup ? `${v} is already in the set, so this is a repeat.` : `${v} is not in the set, so it is new.`,
      variables: { i, value: v, seen: seen.size }, state: snapshot(values, { i }),
      highlights: marks(dup ? [cell(firstAt.get(v)!, "found", "earlier"), cell(i, "active", "i")] : [cell(i, "compared", "i")]),
    });
    if (dup) {
      b.step({
        event: { type: "found", element: indexRef(i) }, anchor: "found", explanation: `${v} appeared at position ${firstAt.get(v)} and again at position ${i}. It is the first repeating value.`,
        variables: { i, value: v }, state: snapshot(values, { i }), highlights: [cell(firstAt.get(v)!, "found", "first"), cell(i, "found", "repeat")],
      });
      return b.build({ time: "O(n)", space: "O(n)", result: v });
    }
    seen.add(v);
    firstAt.set(v, i);
    b.step({
      event: { type: "visit", element: indexRef(i) }, anchor: "store", explanation: `Add ${v} to the set: ${setText()}.`,
      variables: { i, value: v, seen: seen.size }, state: snapshot(values, { i }), highlights: marks(),
    });
  }
  b.step({
    event: { type: "notFound" }, anchor: "not-found", explanation: "Every value was new, so nothing repeats. The answer is -1.", variables: { seen: seen.size }, state: snapshot(values, { i: null }), highlights: marks(),
  });
  return b.build({ time: "O(n)", space: "O(n)", result: -1 });
}

export const firstRepeatingElement: AlgorithmDefinition<FirstRepeatInput> = { id: ID, parseInput, run };
