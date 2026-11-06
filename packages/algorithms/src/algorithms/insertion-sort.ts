import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, parseArrayInput, ptr, snapshot } from "./array-common";

export const ID = "insertion-sort";

export interface InsertionSortInput {
  readonly values: readonly number[];
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<InsertionSortInput> {
  return parseArrayInput(raw, limits, { target: false, sorted: false }) as InputResult<InsertionSortInput>;
}

export function run(input: InsertionSortInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "array",
    input: { values: [...input.values] },
    maxSteps: limits.maxSteps,
  });
  /** The prefix before `i` is sorted among itself (cells being shifted are drawn on top). */
  const prefix = (i: number): Highlight[] => Array.from({ length: i }, (_, k) => cell(k, "sorted"));

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation: `Sort ${fmt(arr)}. Keep a sorted prefix on the left and insert each next value into its place within it, like sorting playing cards in your hand.`,
    variables: {},
    state: snapshot(arr, {}),
  });

  for (let i = 1; i < n; i++) {
    builder.step({
      event: { type: "movePointer", pointer: "i", to: indexRef(i) },
      anchor: "outer-loop",
      explanation: `The first ${i} value${i === 1 ? " is" : "s are"} sorted. Take the value at index ${i} and insert it into that sorted part.`,
      variables: { i },
      state: snapshot(arr, { i }),
      highlights: [...prefix(i), cell(i, "active", "i")],
    });

    const key = arr[i]!;
    let j = i - 1;
    builder.step({
      event: { type: "visit", element: indexRef(i) },
      anchor: "pick-key",
      explanation: `Hold ${key} aside as the key and start comparing with the value to its left (index ${j}).`,
      variables: { i, key, j },
      state: snapshot(arr, { i, j }),
      highlights: [...prefix(i), cell(i, "created", "key"), cell(j, "pointer", "j")],
    });

    for (;;) {
      const keepGoing = j >= 0 && arr[j]! > key;
      builder.step({
        event: j >= 0 ? { type: "visit", element: indexRef(j) } : { type: "movePointer", pointer: "j", to: null },
        anchor: "inner-loop",
        explanation:
          j < 0
            ? `j has moved past the left edge, so ${key} belongs at index 0.`
            : keepGoing
              ? `${arr[j]} > ${key}, so ${arr[j]} must move one place to the right.`
              : `${arr[j]} <= ${key}, so ${key} belongs just after index ${j}.`,
        variables: { i, key, j },
        state: snapshot(arr, { i, j: ptr(j, n) }),
        highlights: [...prefix(i), ...(j >= 0 ? [cell(j, "compared", "j")] : [])],
      });
      if (!keepGoing) break;

      arr[j + 1] = arr[j]!;
      const moved = arr[j]!;
      builder.step({
        event: { type: "assign", target: indexRef(j + 1), value: moved },
        anchor: "shift",
        explanation: `Copy ${moved} one place right, into index ${j + 1}, then move j left. The key ${key} is still held aside.`,
        variables: { i, key, j: j - 1 },
        state: snapshot(arr, { i, j: ptr(j - 1, n) }),
        changed: [indexRef(j + 1)],
        highlights: [...prefix(i), cell(j + 1, "swapped"), ...(j - 1 >= 0 ? [cell(j - 1, "pointer", "j")] : [])],
        motion: "slide",
      });
      j--;
    }

    const unchanged = arr[j + 1] === key && j + 1 === i;
    arr[j + 1] = key;
    builder.step({
      event: { type: "assign", target: indexRef(j + 1), value: key },
      anchor: "insert",
      explanation: unchanged
        ? `${key} is already in the right place at index ${i}; nothing had to move.`
        : `Drop the key ${key} into index ${j + 1}. The first ${i + 1} values are now sorted: ${fmt(arr.slice(0, i + 1))}.`,
      variables: { i, key, j },
      state: snapshot(arr, { i }),
      changed: unchanged ? [] : [indexRef(j + 1)],
      highlights: [...Array.from({ length: i + 1 }, (_, k) => cell(k, k === j + 1 ? "created" : "sorted"))],
    });
  }

  builder.step({
    event: { type: "done" },
    anchor: "finish",
    explanation: `Every value has been inserted. The array is sorted: ${fmt(arr)}.`,
    variables: {},
    state: snapshot(arr, {}),
    highlights: arr.map((_, k) => cell(k, "sorted")),
  });
  return builder.build({ time: "O(n²)", space: "O(1)", result: arr });
}

export const insertionSort: AlgorithmDefinition<InsertionSortInput> = { id: ID, parseInput, run };
