import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, parseArrayInput, ptr, snapshot } from "./array-common";

export const ID = "binary-search";

export interface BinarySearchInput {
  readonly values: readonly number[];
  readonly target: number;
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<BinarySearchInput> {
  return parseArrayInput(raw, limits, { target: true, sorted: true }) as InputResult<BinarySearchInput>;
}

export function run(input: BinarySearchInput, limits: LimitProfile): ExecutionTrace {
  const { values, target } = input;
  const n = values.length;
  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "array",
    input: { values: [...values], target },
    maxSteps: limits.maxSteps,
  });

  let low = 0;
  let high = n - 1;
  let mid: number | null = null;

  const pointers = () => {
    const p: Record<string, number | null> = { low: ptr(low, n), high: ptr(high, n) };
    if (mid !== null) p.mid = mid;
    return p;
  };
  const vars = () => {
    const v: Record<string, number> = { target, low, high };
    if (mid !== null) v.mid = mid;
    return v;
  };
  /** Cells inside the window are `window`; cells already ruled out are `visited`. */
  const windowCells = (): Highlight[] =>
    values.map((_, k) => cell(k, k >= low && k <= high ? "window" : "visited"));
  const withMid = (role: "active" | "compared" | "found", label: string): Highlight[] =>
    windowCells().concat(cell(mid!, role, label));

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation: `Search for ${target} in the sorted array ${fmt(values)}. Each step discards half of the cells still in play.`,
    variables: { target },
    state: snapshot(values, {}),
  });

  builder.step({
    event: { type: "movePointer", pointer: "low", to: n > 0 ? indexRef(0) : null },
    anchor: "init-low",
    explanation: "Start with low at the first index.",
    variables: { target, low },
    state: snapshot(values, { low: ptr(low, n) }),
    highlights: n > 0 ? [cell(0, "active", "low")] : [],
  });

  builder.step({
    event: { type: "movePointer", pointer: "high", to: n > 0 ? indexRef(n - 1) : null },
    anchor: "init-high",
    explanation: n > 0 ? "Start with high at the last index. The window is the whole array." : "The array is empty, so high is -1 and the window is empty.",
    variables: { target, low, high },
    state: snapshot(values, pointers()),
    highlights: windowCells(),
  });

  while (low <= high) {
    mid = null;
    builder.step({
      event: { type: "compare", a: indexRef(low), b: indexRef(high) },
      anchor: "loop",
      explanation: `low (${low}) <= high (${high}), so ${high - low + 1} cell${high - low === 0 ? " is" : "s are"} still in play.`,
      variables: vars(),
      state: snapshot(values, pointers()),
      highlights: windowCells(),
    });

    mid = low + Math.floor((high - low) / 2);
    builder.step({
      event: { type: "movePointer", pointer: "mid", to: indexRef(mid) },
      anchor: "mid",
      explanation: `The middle of the window is index ${mid} (${low} + (${high} - ${low}) / 2), which holds ${values[mid]}.`,
      variables: vars(),
      state: snapshot(values, pointers()),
      highlights: withMid("active", "mid"),
    });

    const value = values[mid]!;
    if (value === target) {
      builder.step({
        event: { type: "visit", element: indexRef(mid) },
        anchor: "compare",
        explanation: `${value} equals ${target}.`,
        variables: { ...vars(), "values[mid]": value },
        state: snapshot(values, pointers()),
        highlights: withMid("compared", "mid"),
      });
      builder.step({
        event: { type: "found", element: indexRef(mid) },
        anchor: "found",
        explanation: `Return index ${mid}.`,
        variables: { ...vars(), "values[mid]": value },
        state: snapshot(values, pointers()),
        highlights: withMid("found", "found"),
      });
      return builder.build({ time: "O(log n)", space: "O(1)", result: mid });
    }

    builder.step({
      event: { type: "visit", element: indexRef(mid) },
      anchor: "compare",
      explanation: `${value} is not ${target}.`,
      variables: { ...vars(), "values[mid]": value },
      state: snapshot(values, pointers()),
      highlights: withMid("compared", "mid"),
    });

    const goRight = value < target;
    builder.step({
      event: { type: "visit", element: indexRef(mid) },
      anchor: "check-less",
      explanation: goRight
        ? `${value} < ${target}, so the target can only be to the right of index ${mid}.`
        : `${value} > ${target}, so the target can only be to the left of index ${mid}.`,
      variables: { ...vars(), "values[mid]": value },
      state: snapshot(values, pointers()),
      highlights: withMid("compared", "mid"),
    });

    if (goRight) {
      low = mid + 1;
      builder.step({
        event: { type: "movePointer", pointer: "low", to: ptr(low, n) === null ? null : indexRef(low) },
        anchor: "go-right",
        explanation: `Discard index ${mid} and everything left of it: low becomes ${low}.`,
        variables: vars(),
        state: snapshot(values, pointers()),
        highlights: windowCells().concat(cell(mid, "visited", "mid")),
      });
    } else {
      high = mid - 1;
      builder.step({
        event: { type: "movePointer", pointer: "high", to: ptr(high, n) === null ? null : indexRef(high) },
        anchor: "go-left",
        explanation: `Discard index ${mid} and everything right of it: high becomes ${high}.`,
        variables: vars(),
        state: snapshot(values, pointers()),
        highlights: windowCells().concat(cell(mid, "visited", "mid")),
      });
    }
  }

  mid = null;
  builder.step({
    event: { type: "notFound" },
    anchor: "not-found",
    explanation: `low (${low}) is greater than high (${high}), so the window is empty and ${target} is not in the array. Return -1.`,
    variables: vars(),
    state: snapshot(values, pointers()),
    highlights: windowCells(),
  });
  return builder.build({ time: "O(log n)", space: "O(1)", result: -1 });
}

export const binarySearch: AlgorithmDefinition<BinarySearchInput> = { id: ID, parseInput, run };
