import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "remove-duplicates-sorted";
export interface RemoveDuplicatesInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<RemoveDuplicatesInput> {
  return parseArrayWithFields(raw, limits, { sortedMessage: "Values must be in ascending order so equal values sit next to each other." }) as InputResult<RemoveDuplicatesInput>;
}

export function run(input: RemoveDuplicatesInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  let slow = 0;
  const kept = (): Highlight[] => arr.slice(0, slow + 1).map((_, k) => cell(k, "sorted"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Remove duplicates from the sorted array ${fmt(arr)} in place. slow marks the end of the unique values; fast scans ahead.`,
    variables: { n }, state: snapshot(arr, {}),
  });
  if (n === 0) {
    b.step({
      event: { type: "done" }, anchor: "check-empty",
      explanation: "The array is empty, so there is nothing to remove. The unique count is 0.",
      variables: { n }, state: snapshot(arr, {}),
    });
    return b.build({ time: "O(n)", space: "O(1)", result: [] });
  }
  b.step({
    event: { type: "compare", a: indexRef(0), b: indexRef(0) }, anchor: "check-empty",
    explanation: "The array is not empty, so the first value is always unique.", variables: { n }, state: snapshot(arr, {}),
  });
  b.step({
    event: { type: "movePointer", pointer: "slow", to: indexRef(0) }, anchor: "init-slow",
    explanation: "Put slow on index 0, the last unique value kept so far.", variables: { n, slow }, state: snapshot(arr, { slow }), highlights: kept(),
  });
  for (let fast = 1; fast < n; fast++) {
    b.step({
      event: { type: "movePointer", pointer: "fast", to: indexRef(fast) }, anchor: "loop",
      explanation: `Move fast to index ${fast}.`, variables: { n, slow, fast }, state: snapshot(arr, { slow, fast }), highlights: [...kept(), cell(fast, "active", "fast")],
    });
    const differs = arr[fast] !== arr[slow];
    b.step({
      event: { type: "compare", a: indexRef(fast), b: indexRef(slow) }, anchor: "compare",
      explanation: differs ? `${arr[fast]} differs from ${arr[slow]}, so it is a new unique value.` : `${arr[fast]} equals ${arr[slow]}, so it is a duplicate and is skipped.`,
      variables: { n, slow, fast }, state: snapshot(arr, { slow, fast }), highlights: [...kept(), cell(fast, "compared")],
    });
    if (differs) {
      slow++;
      b.step({
        event: { type: "movePointer", pointer: "slow", to: indexRef(slow) }, anchor: "advance-slow",
        explanation: `Advance slow to index ${slow}, the next place for a unique value.`,
        variables: { n, slow, fast }, state: snapshot(arr, { slow, fast }), highlights: [cell(fast, "compared"), cell(slow, "active", "slow")],
      });
      arr[slow] = arr[fast]!;
      b.step({
        event: { type: "assign", target: indexRef(slow), value: arr[slow]! }, anchor: "copy",
        explanation: `Copy ${arr[slow]} into index ${slow}.`,
        variables: { n, slow, fast }, state: snapshot(arr, { slow, fast }), changed: [indexRef(slow)], highlights: [...kept(), cell(fast, "compared")], motion: "slide",
      });
    }
  }
  const result = arr.slice(0, slow + 1);
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `The scan is complete. There are ${slow + 1} unique value${slow === 0 ? "" : "s"}: ${fmt(result)}. Anything after index ${slow} is leftover.`,
    variables: { n, count: slow + 1 }, state: snapshot(arr, { slow }),
    highlights: arr.map((_, k) => cell(k, k <= slow ? "sorted" : "visited")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result });
}

export const removeDuplicatesSorted: AlgorithmDefinition<RemoveDuplicatesInput> = { id: ID, parseInput, run };
