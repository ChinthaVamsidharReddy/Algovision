import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "find-maximum";
export interface FindMaximumInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<FindMaximumInput> {
  return parseArrayWithFields(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one value to search." }) as InputResult<FindMaximumInput>;
}

export function run(input: FindMaximumInput, limits: LimitProfile): ExecutionTrace {
  const values = input.values;
  const n = values.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...values] }, maxSteps: limits.maxSteps });
  let best = values[0]!;
  let bestIndex = 0;
  const base = (upTo: number): Highlight[] => values.slice(0, upTo).map((_, k) => cell(k, k === bestIndex ? "found" : "visited", k === bestIndex ? "max" : undefined));

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the largest value in ${fmt(values)} by scanning it once and remembering the biggest value seen so far.`,
    variables: {}, state: snapshot(values, {}),
  });
  b.step({
    event: { type: "movePointer", pointer: "best", to: indexRef(0) }, anchor: "init-max",
    explanation: `Start with the first value, ${best}, as the best so far.`,
    variables: { best, bestIndex }, state: snapshot(values, { best: 0 }), highlights: [cell(0, "found", "max")],
  });
  for (let i = 1; i < n; i++) {
    b.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) }, anchor: "loop",
      explanation: `Look at index ${i}, which holds ${values[i]}.`,
      variables: { best, bestIndex, i }, state: snapshot(values, { best: bestIndex, i }),
      highlights: [...base(i), cell(i, "active", "i")],
    });
    const bigger = values[i]! > best;
    b.step({
      event: { type: "compare", a: indexRef(i), b: indexRef(bestIndex) }, anchor: "compare",
      explanation: bigger ? `${values[i]} > ${best}, so a new largest value has been found.` : `${values[i]} <= ${best}, so the best value stays.`,
      variables: { best, bestIndex, i, "values[i]": values[i]! }, state: snapshot(values, { best: bestIndex, i }),
      highlights: [...base(i), cell(i, "compared")],
    });
    if (bigger) {
      best = values[i]!;
      bestIndex = i;
      b.step({
        event: { type: "assign", target: indexRef(i), value: best }, anchor: "update",
        explanation: `Remember ${best} (index ${i}) as the new best.`,
        variables: { best, bestIndex, i }, state: snapshot(values, { best: bestIndex, i }),
        highlights: [...base(i), cell(i, "found", "max")],
      });
    }
  }
  b.step({
    event: { type: "found", element: indexRef(bestIndex) }, anchor: "finish",
    explanation: `Every value has been checked. The maximum is ${best}, at index ${bestIndex}.`,
    variables: { best, bestIndex }, state: snapshot(values, { best: bestIndex }),
    highlights: [...base(n)], 
  });
  return b.build({ time: "O(n)", space: "O(1)", result: best });
}

export const findMaximum: AlgorithmDefinition<FindMaximumInput> = { id: ID, parseInput, run };
