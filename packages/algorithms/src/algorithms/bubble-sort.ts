import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, parseArrayInput, snapshot } from "./array-common";

export const ID = "bubble-sort";

export interface BubbleSortInput {
  readonly values: readonly number[];
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<BubbleSortInput> {
  return parseArrayInput(raw, limits, { target: false, sorted: false }) as InputResult<BubbleSortInput>;
}

export function run(input: BubbleSortInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "array",
    input: { values: [...input.values] },
    maxSteps: limits.maxSteps,
  });
  /** Cells to the right of `end` are in their final position. */
  const sortedFrom = (end: number): Highlight[] =>
    Array.from({ length: Math.max(0, n - 1 - end) }, (_, k) => cell(end + 1 + k, "sorted"));

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation: `Sort ${fmt(arr)} by repeatedly comparing neighbours and swapping any pair that is out of order. Each pass settles the largest remaining value at the right end.`,
    variables: {},
    state: snapshot(arr, {}),
  });

  for (let end = n - 1; end > 0; end--) {
    builder.step({
      event: { type: "movePointer", pointer: "end", to: indexRef(end) },
      anchor: "outer-loop",
      explanation: `Start a pass over indexes 0 to ${end}. ${end === n - 1 ? "Nothing is settled yet." : "Everything to the right of this is already in its final place."}`,
      variables: { end },
      state: snapshot(arr, { end }),
      highlights: [...sortedFrom(end), cell(end, "pointer", "end")],
    });

    for (let j = 0; j < end; j++) {
      builder.step({
        event: { type: "movePointer", pointer: "j", to: indexRef(j) },
        anchor: "inner-loop",
        explanation: `Look at the neighbours at indexes ${j} and ${j + 1}.`,
        variables: { end, j },
        state: snapshot(arr, { end, j }),
        highlights: [...sortedFrom(end), cell(j, "active", "j")],
      });

      const left = arr[j]!;
      const right = arr[j + 1]!;
      const outOfOrder = left > right;
      builder.step({
        event: { type: "compare", a: indexRef(j), b: indexRef(j + 1) },
        anchor: "compare",
        explanation: outOfOrder
          ? `${left} > ${right}, so they are out of order.`
          : `${left} <= ${right}, so they are already in order.`,
        variables: { end, j, "values[j]": left, "values[j+1]": right },
        state: snapshot(arr, { end, j }),
        highlights: [...sortedFrom(end), cell(j, "compared"), cell(j + 1, "compared")],
      });

      if (outOfOrder) {
        arr[j] = right;
        arr[j + 1] = left;
        builder.step({
          event: { type: "swap", a: indexRef(j), b: indexRef(j + 1) },
          anchor: "swap",
          explanation: `Swap ${left} and ${right} so the smaller value comes first.`,
          variables: { end, j, "values[j]": right, "values[j+1]": left },
          state: snapshot(arr, { end, j }),
          changed: [indexRef(j), indexRef(j + 1)],
          highlights: [...sortedFrom(end), cell(j, "swapped"), cell(j + 1, "swapped")],
          motion: "swap",
        });
      }
    }
  }

  builder.step({
    event: { type: "done" },
    anchor: "finish",
    explanation: `Every pass is done and the array is sorted: ${fmt(arr)}.`,
    variables: {},
    state: snapshot(arr, {}),
    highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return builder.build({ time: "O(n²)", space: "O(1)", result: arr });
}

export const bubbleSort: AlgorithmDefinition<BubbleSortInput> = { id: ID, parseInput, run };
