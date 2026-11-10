import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { ArrayTrace, cell, fmt, indexRef, parseChecked } from "./array-trace";

interface Values { readonly values: readonly number[] }
interface Targeted extends Values { readonly target: number }
const TARGET = [{ name: "target", label: "The value to find" }];
const SORTED = "Values must be in ascending order for binary search.";

// ---------------------------------------------------------------- next permutation
export const NEXT_PERM_ID = "next-permutation";
export function parseNextPerm(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one value." }, () => []);
}
export function runNextPerm({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(NEXT_PERM_ID, { values: [...values] }, values, limits);
  const a = T.values;
  const n = a.length;
  T.step({ type: "init" }, "entry", `Rearrange ${fmt(values)} into the next larger arrangement in dictionary order. If it is already the largest, wrap around to the smallest.`, {});
  let i = n - 2;
  T.step({ type: "init" }, "init", "Look for the pivot: scan from the right for the first value that is smaller than the value after it.", { i }, { i, next: i + 1 }, n >= 2 ? [cell(i, "active", "i"), cell(i + 1, "compared")] : []);
  while (i >= 0 && a[i]! >= a[i + 1]!) {
    T.step({ type: "compare", a: indexRef(i), b: indexRef(i + 1) }, "find-pivot", `${a[i]} is not smaller than ${a[i + 1]}: the tail is still in descending order, so move left.`, { i }, { i }, [cell(i, "compared", "i"), cell(i + 1, "compared")]);
    i--;
  }
  if (i >= 0) {
    T.step({ type: "found", element: indexRef(i) }, "find-pivot", `${a[i]} is smaller than ${a[i + 1]}, so index ${i} is the pivot. Everything to its right is in descending order.`, { i }, { i }, [cell(i, "found", "pivot")]);
    let j = n - 1;
    T.step({ type: "init" }, "find-swap", "Find the smallest value to the right of the pivot that is still larger than it, scanning from the end.", { i, j }, { i, j }, [cell(i, "found", "pivot"), cell(j, "active", "j")]);
    while (a[j]! <= a[i]!) {
      T.step({ type: "compare", a: indexRef(i), b: indexRef(j) }, "find-swap", `${a[j]} is not larger than ${a[i]}, so move left.`, { i, j }, { i, j }, [cell(i, "found", "pivot"), cell(j, "compared", "j")]);
      j--;
    }
    T.step({ type: "found", element: indexRef(j) }, "find-swap", `${a[j]} is the smallest value larger than the pivot ${a[i]}.`, { i, j }, { i, j }, [cell(i, "found", "pivot"), cell(j, "found", "j")]);
    [a[i], a[j]] = [a[j]!, a[i]!];
    T.step({ type: "swap", a: indexRef(i), b: indexRef(j) }, "swap", `Swap them: the pivot position now holds ${a[i]}.`, { i, j }, { i, j }, [cell(i, "swapped"), cell(j, "swapped")], [i, j]);
  } else {
    T.step({ type: "init" }, "find-pivot", "No pivot exists: the whole array is in descending order, so it is the largest arrangement. Wrap around by reversing everything.", { i }, {}, a.map((_, k) => cell(k, "compared")));
  }
  let lo = i + 1;
  let hi = n - 1;
  T.step({ type: "init" }, "reverse-init", `Reverse the tail from index ${lo} to the end to make it as small as possible (it is currently descending).`, { lo, hi }, { lo, hi }, lo <= hi ? [cell(lo, "active", "lo"), cell(hi, "active", "hi")] : []);
  while (lo < hi) {
    [a[lo], a[hi]] = [a[hi]!, a[lo]!];
    T.step({ type: "swap", a: indexRef(lo), b: indexRef(hi) }, "reverse", `Swap ${a[hi]} and ${a[lo]} to reverse the tail.`, { lo, hi }, { lo, hi }, [cell(lo, "swapped", "lo"), cell(hi, "swapped", "hi")], [lo, hi]);
    lo++;
    hi--;
  }
  T.step({ type: "done" }, "finish", `The next permutation is ${fmt(a)}.`, {}, {}, a.map((_, k) => cell(k, "found")));
  return T.finish([...a], "O(n)", "O(1)");
}
export const nextPermutation: AlgorithmDefinition<Values> = { id: NEXT_PERM_ID, parseInput: parseNextPerm, run: runNextPerm };

// ---------------------------------------------------------------- lower / upper bound
function runBound(id: string, upper: boolean, { values, target }: Targeted, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(id, { values: [...values], target }, values, limits);
  const n = values.length;
  const word = upper ? "greater than" : "at least";
  T.step({ type: "init" }, "entry", `In the sorted array ${fmt(values)}, find the first index whose value is ${word} ${target}. If none is, the answer is ${n} (one past the end).`, { target });
  let low = 0;
  let high = n;
  T.step({ type: "init" }, "init", `The answer lies between ${low} and ${high}. Cell ${high} is a virtual "past the end" position.`, { target, low, high }, { low, high });
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    T.step({ type: "init" }, "loop", `Candidates ${low} to ${high - 1} remain. Check the middle, index ${mid}.`, { target, low, high, mid }, { low, high, mid }, [...Array.from({ length: high - low }, (_, k) => cell(low + k, "pointer")), cell(mid, "active", "mid")]);
    const goRight = upper ? values[mid]! <= target : values[mid]! < target;
    T.step({ type: "compare", a: indexRef(mid), b: indexRef(mid) }, "compare", goRight ? `${values[mid]} is ${upper ? "not greater than" : "less than"} ${target}, so the answer is to the right of ${mid}.` : `${values[mid]} is ${word} ${target}, so ${mid} could be the answer; keep it and look left.`, { target, low, high, mid }, { low, high, mid }, [cell(mid, goRight ? "compared" : "found", "mid")]);
    if (goRight) {
      low = mid + 1;
      T.step({ type: "movePointer", pointer: "low", to: indexRef(Math.min(low, n - 1)) }, "go-right", `Discard the left half: low = ${low}.`, { target, low, high }, { low, high });
    } else {
      high = mid;
      T.step({ type: "movePointer", pointer: "high", to: indexRef(Math.min(high, n - 1)) }, "go-left", `Discard the right half but keep mid: high = ${high}.`, { target, low, high }, { low, high });
    }
  }
  T.step(low < n ? { type: "found", element: indexRef(low) } : { type: "notFound" }, "finish", low < n ? `The range is empty. The first value ${word} ${target} is ${values[low]} at index ${low}.` : `The range is empty and every value is ${upper ? "at most" : "less than"} ${target}, so the answer is ${n} (past the end).`, { target, answer: low }, { low }, low < n ? [cell(low, "found", "answer")] : []);
  return T.finish(low, "O(log n)", "O(1)");
}
export function parseBound(raw: unknown, limits: LimitProfile): InputResult<Targeted> {
  return parseChecked<Targeted>(raw, limits, { sortedMessage: SORTED, fields: TARGET }, () => []);
}
export const LOWER_ID = "lower-bound";
export const UPPER_ID = "upper-bound";
export const runLowerBound = (i: Targeted, l: LimitProfile) => runBound(LOWER_ID, false, i, l);
export const runUpperBound = (i: Targeted, l: LimitProfile) => runBound(UPPER_ID, true, i, l);
export const lowerBound: AlgorithmDefinition<Targeted> = { id: LOWER_ID, parseInput: parseBound, run: runLowerBound };
export const upperBound: AlgorithmDefinition<Targeted> = { id: UPPER_ID, parseInput: parseBound, run: runUpperBound };

// ---------------------------------------------------------------- search in rotated sorted array
export const ROTATED_ID = "search-rotated-array";
export function parseRotated(raw: unknown, limits: LimitProfile): InputResult<Targeted> {
  return parseChecked<Targeted>(raw, limits, { fields: TARGET }, ({ values }) => {
    if (new Set(values).size !== values.length) return [{ field: "values", message: "Values must all be different." }];
    let drops = 0;
    for (let i = 0; i < values.length; i++) if (values[i]! > values[(i + 1) % values.length]!) drops++;
    return drops > 1 ? [{ field: "values", message: "The array must be a sorted array rotated by some amount, such as 4, 5, 6, 1, 2, 3." }] : [];
  });
}
export function runRotated({ values, target }: Targeted, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(ROTATED_ID, { values: [...values], target }, values, limits);
  const n = values.length;
  T.step({ type: "init" }, "entry", `${fmt(values)} is a sorted array that was rotated. Find ${target}. At every step one half around the middle is still sorted, which tells us whether the target can be inside it.`, { target });
  let low = 0;
  let high = n - 1;
  T.step({ type: "init" }, "init", `Search the whole array: low = ${low}, high = ${high}.`, { target, low, high }, { low, high });
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    T.step({ type: "init" }, "loop", `Check the middle, index ${mid}.`, { target, low, high, mid }, { low, high, mid }, [...Array.from({ length: high - low + 1 }, (_, k) => cell(low + k, "pointer")), cell(mid, "active", "mid")]);
    if (values[mid] === target) {
      T.step({ type: "found", element: indexRef(mid) }, "found", `${values[mid]} equals ${target}: found at index ${mid}.`, { target, low, high, mid }, { low, high, mid }, [cell(mid, "found", "mid")]);
      return T.finish(mid, "O(log n)", "O(1)");
    }
    T.step({ type: "compare", a: indexRef(mid), b: indexRef(mid) }, "found", `${values[mid]} is not ${target}.`, { target, low, high, mid }, { low, high, mid }, [cell(mid, "compared", "mid")]);
    const leftSorted = values[low]! <= values[mid]!;
    T.step({ type: "compare", a: indexRef(low), b: indexRef(mid) }, "which-half", leftSorted ? `${values[low]} <= ${values[mid]}, so the left half ${low}..${mid} is sorted.` : `${values[low]} > ${values[mid]}, so the right half ${mid}..${high} is sorted.`, { target, low, high, mid }, { low, high, mid }, leftSorted ? [cell(low, "visited", "low"), cell(mid, "compared", "mid")] : [cell(mid, "compared", "mid"), cell(high, "visited", "high")]);
    if (leftSorted) {
      if (values[low]! <= target && target < values[mid]!) {
        high = mid - 1;
        T.step({ type: "movePointer", pointer: "high", to: indexRef(Math.max(high, 0)) }, "in-left", `${target} lies within the sorted left half (${values[low]} to ${values[mid]}), so search there: high = ${high}.`, { target, low, high }, { low, high });
      } else {
        low = mid + 1;
        T.step({ type: "movePointer", pointer: "low", to: indexRef(Math.min(low, n - 1)) }, "in-right", `${target} is not within the sorted left half, so search the right: low = ${low}.`, { target, low, high }, { low, high });
      }
    } else if (values[mid]! < target && target <= values[high]!) {
      low = mid + 1;
      T.step({ type: "movePointer", pointer: "low", to: indexRef(Math.min(low, n - 1)) }, "in-right", `${target} lies within the sorted right half (${values[mid]} to ${values[high]}), so search there: low = ${low}.`, { target, low, high }, { low, high });
    } else {
      high = mid - 1;
      T.step({ type: "movePointer", pointer: "high", to: indexRef(Math.max(high, 0)) }, "in-left", `${target} is not within the sorted right half, so search the left: high = ${high}.`, { target, low, high }, { low, high });
    }
  }
  T.step({ type: "notFound" }, "finish", `The range is empty, so ${target} is not in the array.`, { target }, {});
  return T.finish(-1, "O(log n)", "O(1)");
}
export const searchRotatedArray: AlgorithmDefinition<Targeted> = { id: ROTATED_ID, parseInput: parseRotated, run: runRotated };

// ---------------------------------------------------------------- find a peak element
export const PEAK_ID = "find-peak-element";
export function parsePeak(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one value." }, ({ values }) =>
    values.some((v, i) => i > 0 && v === values[i - 1]) ? [{ field: "values", message: "Neighbouring values must be different." }] : [],
  );
}
export function runPeak({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(PEAK_ID, { values: [...values] }, values, limits);
  const n = values.length;
  T.step({ type: "init" }, "entry", `A peak is a value larger than both neighbours (the ends only have one). Find the index of any peak in ${fmt(values)}. Climbing uphill always reaches one, so binary search can follow the slope.`, {});
  let low = 0;
  let high = n - 1;
  T.step({ type: "init" }, "init", `Search the whole array: low = ${low}, high = ${high}.`, { low, high }, { low, high });
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    T.step({ type: "init" }, "loop", `Check the middle, index ${mid}, against its right neighbour at ${mid + 1}.`, { low, high, mid }, { low, high, mid }, [...Array.from({ length: high - low + 1 }, (_, k) => cell(low + k, "pointer")), cell(mid, "active", "mid"), cell(mid + 1, "compared")]);
    const up = values[mid]! < values[mid + 1]!;
    T.step({ type: "compare", a: indexRef(mid), b: indexRef(mid + 1) }, "compare", up ? `${values[mid]} < ${values[mid + 1]}: the slope rises to the right, so a peak exists to the right.` : `${values[mid]} > ${values[mid + 1]}: the slope falls to the right, so mid or something to its left is a peak.`, { low, high, mid }, { low, high, mid }, [cell(mid, "active", "mid"), cell(mid + 1, up ? "found" : "compared")]);
    if (up) {
      low = mid + 1;
      T.step({ type: "movePointer", pointer: "low", to: indexRef(low) }, "go-right", `Climb right: low = ${low}.`, { low, high }, { low, high });
    } else {
      high = mid;
      T.step({ type: "movePointer", pointer: "high", to: indexRef(high) }, "go-left", `Keep mid and look left: high = ${high}.`, { low, high }, { low, high });
    }
  }
  T.step({ type: "found", element: indexRef(low) }, "finish", `low and high meet at index ${low}. ${values[low]} is a peak.`, { peak: low }, { low }, [cell(low, "found", "peak")]);
  return T.finish(low, "O(log n)", "O(1)");
}
export const findPeakElement: AlgorithmDefinition<Values> = { id: PEAK_ID, parseInput: parsePeak, run: runPeak };
