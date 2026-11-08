import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "jump-search";
export interface JumpSearchInput { readonly values: readonly number[]; readonly target: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<JumpSearchInput> {
  return parseArrayWithFields(raw, limits, { sortedMessage: "Values must be in ascending order for jump search.", fields: [{ name: "target", label: "The value to find" }] }) as InputResult<JumpSearchInput>;
}

export function run(input: JumpSearchInput, limits: LimitProfile): ExecutionTrace {
  const { values, target } = input;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values], target }, maxSteps: limits.maxSteps });
  let step = 1;
  while ((step + 1) * (step + 1) <= n) step++;
  let prev = 0;
  let end = step < n ? step : n;
  const block = (lo: number, hi: number): Highlight[] => values.map((_, k) => cell(k, k >= lo && k < hi ? "window" : k < lo ? "visited" : "visited"));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Search the sorted array ${fmt(values)} for ${target}. Jump ahead a block at a time to find the right block, then scan inside it.`,
    variables: { target }, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-step",
    explanation: `Choose a block size near the square root of ${n}: step = ${step}.`,
    variables: { n, step }, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-prev",
    explanation: "The current block starts at index 0.", variables: { step, prev }, state: snapshot(values, { prev: ptr(prev, n) }), highlights: [],
  });
  b.step({
    event: { type: "init" }, anchor: "block-end",
    explanation: `The block covers indexes ${prev} to ${end - 1}. end = ${end} is just after it.`,
    variables: { step, prev, end }, state: snapshot(values, { prev: ptr(prev, n) }), highlights: block(prev, end),
  });
  for (;;) {
    const last = end - 1;
    const jump = prev < n && values[last]! < target;
    b.step({
      event: prev < n ? { type: "compare", a: indexRef(last), b: indexRef(last) } : { type: "init" }, anchor: "jump-check",
      explanation: prev >= n ? "There are no blocks left." : jump ? `The last value of the block, ${values[last]}, is smaller than ${target}, so the target is not in this block. Jump to the next one.` : `The last value of the block, ${values[last]}, is not smaller than ${target}, so if ${target} is present it is in this block.`,
      variables: { prev, end, target }, state: snapshot(values, { prev: ptr(prev, n), end: ptr(last, n) }), highlights: [...block(prev, end), ...(prev < n ? [cell(last, "compared", "end-1")] : [])],
    });
    if (!jump) break;
    prev = end;
    b.step({
      event: { type: "movePointer", pointer: "prev", to: prev < n ? indexRef(prev) : null }, anchor: "jump",
      explanation: `Jump: the next block starts at index ${prev}.`,
      variables: { prev, end }, state: snapshot(values, { prev: ptr(prev, n) }), highlights: block(prev, prev + step),
    });
    end = prev + step < n ? prev + step : n;
    b.step({
      event: { type: "init" }, anchor: "block-end",
      explanation: `The block covers indexes ${prev} to ${Math.max(prev, end - 1)}. end = ${end}.`,
      variables: { prev, end }, state: snapshot(values, { prev: ptr(prev, n) }), highlights: block(prev, end),
    });
  }
  let result = -1;
  for (let i = prev; i < end; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "linear-loop",
      explanation: `Scan inside the block: look at index ${i}.`,
      variables: { i, prev, end }, state: snapshot(values, { i }), highlights: [...block(prev, end), cell(i, "active", "i")],
    });
    const hit = values[i] === target;
    b.step({
      event: { type: "compare", a: indexRef(i), b: indexRef(i) }, anchor: "linear-compare",
      explanation: hit ? `${values[i]} equals ${target}.` : `${values[i]} is not ${target}.`,
      variables: { i, "values[i]": values[i]! }, state: snapshot(values, { i }), highlights: [...block(prev, end), cell(i, "compared")],
    });
    if (hit) {
      result = i;
      b.step({
        event: { type: "found", element: indexRef(i) }, anchor: "found",
        explanation: `Found ${target} at index ${i}.`,
        variables: { i }, state: snapshot(values, { i }), highlights: [cell(i, "found")],
      });
      break;
    }
  }
  if (result < 0) {
    b.step({
      event: { type: "notFound" }, anchor: "not-found",
      explanation: `${target} is not in the array, so the answer is -1.`,
      variables: {}, state: snapshot(values, {}), highlights: values.map((_, k) => cell(k, "visited")),
    });
  }
  return b.build({ time: "O(√n)", space: "O(1)", result });
}

export const jumpSearch: AlgorithmDefinition<JumpSearchInput> = { id: ID, parseInput, run };
