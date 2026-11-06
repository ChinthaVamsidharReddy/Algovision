import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, parseArrayInput, snapshot } from "./array-common";

export const ID = "linear-search";

export interface LinearSearchInput {
  readonly values: readonly number[];
  readonly target: number;
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<LinearSearchInput> {
  return parseArrayInput(raw, limits, { target: true, sorted: false }) as InputResult<LinearSearchInput>;
}

export function run(input: LinearSearchInput, limits: LimitProfile): ExecutionTrace {
  const { values, target } = input;
  const n = values.length;
  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "array",
    input: { values: [...values], target },
    maxSteps: limits.maxSteps,
  });
  const visited = (upTo: number): Highlight[] => Array.from({ length: upTo }, (_, k) => cell(k, "visited"));

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation: `Search for ${target} in ${fmt(values)} by checking each cell from left to right.`,
    variables: { target },
    state: snapshot(values, {}),
  });

  for (let i = 0; i < n; i++) {
    builder.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) },
      anchor: "loop",
      explanation: `Move to index ${i}, which holds ${values[i]}.`,
      variables: { target, i },
      state: snapshot(values, { i }),
      highlights: [...visited(i), cell(i, "active", "i")],
    });
    const equal = values[i] === target;
    builder.step({
      event: { type: "visit", element: indexRef(i) },
      anchor: "compare",
      explanation: equal
        ? `${values[i]} equals ${target}, so we found it.`
        : `${values[i]} is not ${target}, so keep looking.`,
      variables: { target, i, "values[i]": values[i]! },
      state: snapshot(values, { i }),
      highlights: [...visited(i), cell(i, "compared", "i")],
    });
    if (equal) {
      builder.step({
        event: { type: "found", element: indexRef(i) },
        anchor: "found",
        explanation: `Return index ${i}. The search stopped early, after checking ${i + 1} of ${n} cells.`,
        variables: { target, i, "values[i]": values[i]! },
        state: snapshot(values, { i }),
        highlights: [...visited(i), cell(i, "found", "found")],
      });
      return builder.build({ time: "O(n)", space: "O(1)", result: i });
    }
  }

  builder.step({
    event: { type: "notFound" },
    anchor: "not-found",
    explanation: `Every cell was checked and none equals ${target}. Return -1.`,
    variables: { target },
    state: snapshot(values, {}),
    highlights: visited(n),
  });
  return builder.build({ time: "O(n)", space: "O(1)", result: -1 });
}

export const linearSearch: AlgorithmDefinition<LinearSearchInput> = { id: ID, parseInput, run };
