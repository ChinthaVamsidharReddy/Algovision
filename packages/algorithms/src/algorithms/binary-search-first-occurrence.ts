import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "binary-search-first-occurrence";
export interface FirstOccurrenceInput { readonly values: readonly number[]; readonly target: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<FirstOccurrenceInput> {
  return parseArrayWithFields(raw, limits, { sortedMessage: "Values must be in ascending order for binary search.", fields: [{ name: "target", label: "The value to find" }] }) as InputResult<FirstOccurrenceInput>;
}

export function run(input: FirstOccurrenceInput, limits: LimitProfile): ExecutionTrace {
  const { values, target } = input;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values], target }, maxSteps: limits.maxSteps });
  let low = 0;
  let high = n - 1;
  let result = -1;
  const ptrs = (mid?: number) => ({ low: ptr(low, n), high: ptr(high, n), ...(mid === undefined ? {} : { mid }) });
  const range = (extra: Highlight[] = []): Highlight[] => [...values.map((_, k) => cell(k, k >= low && k <= high ? "window" : "visited")), ...extra];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the FIRST index of ${target} in the sorted array ${fmt(values)}. A normal binary search may land on any copy; this one keeps searching left after each match.`,
    variables: { target }, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-low", explanation: "low is the left edge of the search range: index 0.",
    variables: { low }, state: snapshot(values, ptrs()), highlights: range(),
  });
  b.step({
    event: { type: "init" }, anchor: "init-high", explanation: `high is the right edge: index ${high}.`,
    variables: { low, high }, state: snapshot(values, ptrs()), highlights: range(),
  });
  b.step({
    event: { type: "init" }, anchor: "init-result", explanation: "result = -1 means no match has been found yet.",
    variables: { low, high, result }, state: snapshot(values, ptrs()), highlights: range(),
  });
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    b.step({
      event: { type: "compare", a: indexRef(low), b: indexRef(high) }, anchor: "loop",
      explanation: `Range ${low}..${high} is not empty, so keep searching.`,
      variables: { low, high, result }, state: snapshot(values, ptrs()), highlights: range(),
    });
    b.step({
      event: { type: "movePointer", pointer: "mid", to: indexRef(mid) }, anchor: "mid",
      explanation: `The middle of the range is index ${mid}, which holds ${values[mid]}.`,
      variables: { low, high, mid, result }, state: snapshot(values, ptrs(mid)), highlights: range([cell(mid, "active", "mid")]),
    });
    const v = values[mid]!;
    b.step({
      event: { type: "compare", a: indexRef(mid), b: indexRef(mid) }, anchor: "check-equal",
      explanation: v === target ? `${v} equals ${target}: a match, but there may be an earlier one.` : `${v} is not ${target}.`,
      variables: { low, high, mid, "values[mid]": v, result }, state: snapshot(values, ptrs(mid)), highlights: range([cell(mid, "compared")]),
    });
    if (v === target) {
      result = mid;
      b.step({
        event: { type: "assign", target: indexRef(mid), value: mid }, anchor: "record",
        explanation: `Remember index ${mid} as the best answer so far.`,
        variables: { low, high, mid, result }, state: snapshot(values, ptrs(mid)), highlights: range([cell(mid, "found", "best")]),
      });
      high = mid - 1;
      b.step({
        event: { type: "movePointer", pointer: "high", to: ptr(high, n) === null ? null : indexRef(high) }, anchor: "go-left-eq",
        explanation: `Look for an even earlier copy: move high to ${high}.`,
        variables: { low, high, result }, state: snapshot(values, ptrs()), highlights: range(),
      });
      continue;
    }
    b.step({
      event: { type: "compare", a: indexRef(mid), b: indexRef(mid) }, anchor: "check-less",
      explanation: v < target ? `${v} < ${target}, so ${target} can only be to the right.` : `${v} > ${target}, so ${target} can only be to the left.`,
      variables: { low, high, mid }, state: snapshot(values, ptrs(mid)), highlights: range([cell(mid, "compared")]),
    });
    if (v < target) {
      low = mid + 1;
      b.step({
        event: { type: "movePointer", pointer: "low", to: ptr(low, n) === null ? null : indexRef(low) }, anchor: "go-right",
        explanation: `Discard the left half: move low to ${low}.`,
        variables: { low, high, result }, state: snapshot(values, ptrs()), highlights: range(),
      });
    } else {
      high = mid - 1;
      b.step({
        event: { type: "movePointer", pointer: "high", to: ptr(high, n) === null ? null : indexRef(high) }, anchor: "go-left",
        explanation: `Discard the right half: move high to ${high}.`,
        variables: { low, high, result }, state: snapshot(values, ptrs()), highlights: range(),
      });
    }
  }
  b.step({
    event: result >= 0 ? { type: "found", element: indexRef(result) } : { type: "notFound" }, anchor: "finish",
    explanation: result >= 0 ? `The range is empty. The first occurrence of ${target} is at index ${result}.` : `The range is empty and ${target} was never found, so the answer is -1.`,
    variables: { result }, state: snapshot(values, result >= 0 ? { result } : {}), highlights: result >= 0 ? [cell(result, "found")] : values.map((_, k) => cell(k, "visited")),
  });
  return b.build({ time: "O(log n)", space: "O(1)", result });
}

export const binarySearchFirstOccurrence: AlgorithmDefinition<FirstOccurrenceInput> = { id: ID, parseInput, run };
