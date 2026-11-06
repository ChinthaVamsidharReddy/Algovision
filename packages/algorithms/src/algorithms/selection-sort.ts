import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, parseArrayInput, snapshot } from "./array-common";

export const ID = "selection-sort";

export interface SelectionSortInput {
  readonly values: readonly number[];
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<SelectionSortInput> {
  return parseArrayInput(raw, limits, { target: false, sorted: false }) as InputResult<SelectionSortInput>;
}

export function run(input: SelectionSortInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "array",
    input: { values: [...input.values] },
    maxSteps: limits.maxSteps,
  });
  /** Cells left of `i` already hold their final values. */
  const sorted = (i: number): Highlight[] => Array.from({ length: i }, (_, k) => cell(k, "sorted"));

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation: `Sort ${fmt(arr)}. Each pass finds the smallest value in the unsorted part and swaps it into the next position from the left.`,
    variables: {},
    state: snapshot(arr, {}),
  });

  for (let i = 0; i < n - 1; i++) {
    builder.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) },
      anchor: "outer-loop",
      explanation: `Start pass ${i + 1}. Everything left of index ${i} is already in its final place; find the smallest value from index ${i} onward.`,
      variables: { i },
      state: snapshot(arr, { i }),
      highlights: [...sorted(i), cell(i, "active", "i")],
    });

    let min = i;
    builder.step({
      event: { type: "movePointer", pointer: "min", to: indexRef(min) },
      anchor: "init-min",
      explanation: `Assume the smallest value is at index ${i} (${arr[i]}) until we find a smaller one.`,
      variables: { i, min },
      state: snapshot(arr, { i, min }),
      highlights: [...sorted(i), cell(i, "pointer", "i, min")],
    });

    for (let j = i + 1; j < n; j++) {
      builder.step({
        event: { type: "movePointer", pointer: "j", to: indexRef(j) },
        anchor: "inner-loop",
        explanation: `Look at index ${j}, which holds ${arr[j]}.`,
        variables: { i, min, j },
        state: snapshot(arr, { i, min, j }),
        highlights: [...sorted(i), cell(i, "visited", "i"), cell(min, "pointer", "min"), cell(j, "active", "j")],
      });

      const smaller = arr[j]! < arr[min]!;
      builder.step({
        event: { type: "compare", a: indexRef(j), b: indexRef(min) },
        anchor: "compare",
        explanation: smaller
          ? `${arr[j]} < ${arr[min]}, so index ${j} holds a new smallest value.`
          : `${arr[j]} >= ${arr[min]}, so the smallest value so far does not change.`,
        variables: { i, min, j, "values[j]": arr[j]!, "values[min]": arr[min]! },
        state: snapshot(arr, { i, min, j }),
        highlights: [...sorted(i), cell(min, "compared", "min"), cell(j, "compared", "j")],
      });

      if (smaller) {
        min = j;
        builder.step({
          event: { type: "movePointer", pointer: "min", to: indexRef(min) },
          anchor: "new-min",
          explanation: `Remember index ${min} as the smallest so far.`,
          variables: { i, min, j },
          state: snapshot(arr, { i, min, j }),
          highlights: [...sorted(i), cell(min, "pointer", "min"), cell(j, "active", "j")],
        });
      }
    }

    const a = arr[i]!;
    const b = arr[min]!;
    arr[i] = b;
    arr[min] = a;
    builder.step({
      event: { type: "swap", a: indexRef(i), b: indexRef(min) },
      anchor: "swap",
      explanation:
        min === i
          ? `The smallest value (${a}) is already at index ${i}. Swapping it with itself changes nothing.`
          : `Swap index ${i} (${a}) with index ${min} (${b}) so the smallest value ${b} lands at index ${i}.`,
      variables: { i, min },
      state: snapshot(arr, { i, min }),
      changed: min === i ? [] : [indexRef(i), indexRef(min)],
      highlights: [...sorted(i), cell(i, min === i ? "sorted" : "swapped"), ...(min === i ? [] : [cell(min, "swapped")])],
      motion: min === i ? undefined : "swap",
    });
  }

  builder.step({
    event: { type: "done" },
    anchor: "finish",
    explanation: `Every position holds its final value. The array is sorted: ${fmt(arr)}.`,
    variables: {},
    state: snapshot(arr, {}),
    highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return builder.build({ time: "O(n²)", space: "O(1)", result: arr });
}

export const selectionSort: AlgorithmDefinition<SelectionSortInput> = { id: ID, parseInput, run };
