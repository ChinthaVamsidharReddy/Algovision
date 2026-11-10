import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { ArrayTrace, cell, fmt, indexRef, parseChecked } from "./array-trace";

interface Values { readonly values: readonly number[] }
const any = (r: unknown) => r as InputResult<Values>;

// ---------------------------------------------------------------- majority element (Boyer-Moore)
export const MAJORITY_ID = "majority-element-boyer-moore";
export function parseMajority(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one value." }, ({ values }) => {
    const count = new Map<number, number>();
    for (const v of values) count.set(v, (count.get(v) ?? 0) + 1);
    return [...count.values()].some((c) => c > values.length / 2) ? [] : [{ field: "values", message: "The array must have a value that appears more than half the time." }];
  });
}
export function runMajority({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(MAJORITY_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `Find the value that appears more than half the time in ${fmt(values)}. Different values cancel each other out in pairs, and the majority value is the one left over.`, {});
  let candidate = 0;
  let count = 0;
  T.step({ type: "init" }, "init", "Start with no candidate and a count of 0.", { candidate, count });
  for (let i = 0; i < values.length; i++) {
    const x = values[i]!;
    const seen = values.map((_, k) => cell(k, k < i ? "visited" : "pointer")).slice(0, i);
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "loop", `Look at index ${i}, which holds ${x}.`, { i, candidate, count }, { i }, [...seen, cell(i, "active", "i")]);
    if (count === 0) {
      candidate = x;
      T.step({ type: "assign", target: indexRef(i), value: x }, "new-candidate", `The count is 0, so there is no candidate to defend. ${x} becomes the candidate.`, { i, candidate, count }, { i }, [...seen, cell(i, "found", "candidate")], [i]);
    } else {
      T.step({ type: "init" }, "new-candidate", `The count is ${count}, so the candidate ${candidate} stays.`, { i, candidate, count }, { i }, [...seen, cell(i, "active", "i")]);
    }
    if (x === candidate) {
      count++;
      T.step({ type: "compare", a: indexRef(i), b: indexRef(i) }, "vote", `${x} equals the candidate ${candidate}, so it votes for it: count = ${count}.`, { i, candidate, count }, { i }, [...seen, cell(i, "found", "same")]);
    } else {
      count--;
      T.step({ type: "compare", a: indexRef(i), b: indexRef(i) }, "vote", `${x} differs from the candidate ${candidate}, so the two cancel: count = ${count}.`, { i, candidate, count }, { i }, [...seen, cell(i, "compared", "differs")]);
    }
  }
  T.step({ type: "done" }, "finish", `Every other value was cancelled by a different one, so the majority value is ${candidate}.`, { candidate, count }, {}, values.map((v, k) => cell(k, v === candidate ? "found" : "visited")));
  return T.finish(candidate, "O(n)", "O(1)");
}
export const majorityElement: AlgorithmDefinition<Values> = { id: MAJORITY_ID, parseInput: parseMajority, run: runMajority };

// ---------------------------------------------------------------- best time to buy and sell stock
export const STOCK_ID = "best-time-to-buy-sell-stock";
export function parseStock(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return any(parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one price.", valueMin: 0, valueMax: 999, valueMessage: "Each price must be a whole number from 0 to 999.", noun: "price list" }, () => []));
}
export function runStock({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(STOCK_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `Each value is a day's price. Find the biggest profit from buying on one day and selling on a later day in ${fmt(values)}. Walk forward remembering the cheapest day so far.`, {});
  let min = values[0]!;
  let minAt = 0;
  let best = 0;
  let bestBuy = 0;
  let bestSell = 0;
  T.step({ type: "init" }, "init", `Pretend we bought on day 0 at price ${min}. The best profit so far is 0.`, { minPrice: min, best }, { buy: 0 }, [cell(0, "found", "buy")]);
  for (let i = 1; i < values.length; i++) {
    const p = values[i]!;
    const marks = [cell(minAt, "found", "buy"), cell(i, "active", "i")];
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "loop", `Look at day ${i}, with price ${p}.`, { i, minPrice: min, best }, { i, buy: minAt }, marks);
    if (p < min) {
      min = p;
      minAt = i;
      T.step({ type: "assign", target: indexRef(i), value: p }, "new-min", `${p} is cheaper than every earlier price, so day ${i} becomes the best day to buy.`, { i, minPrice: min, best }, { i, buy: minAt }, [cell(minAt, "found", "buy"), cell(i, "active", "i")], [i]);
    } else {
      const profit = p - min;
      const better = profit > best;
      if (better) { best = profit; bestBuy = minAt; bestSell = i; }
      T.step({ type: "compare", a: indexRef(minAt), b: indexRef(i) }, "profit", better ? `Selling today earns ${p} - ${min} = ${profit}, more than the best so far, so best = ${best}.` : `Selling today earns ${p} - ${min} = ${profit}, which does not beat the best, ${best}.`, { i, minPrice: min, best }, { i, buy: minAt }, [cell(minAt, "found", "buy"), cell(i, better ? "found" : "compared", better ? "sell" : undefined)]);
    }
  }
  T.step({ type: "done" }, "finish", best === 0 ? "No day is cheaper than a later day, so the best profit is 0 (do not trade)." : `Buy on day ${bestBuy} at ${values[bestBuy]} and sell on day ${bestSell} at ${values[bestSell]}: profit ${best}.`, { best }, {}, best === 0 ? [] : [cell(bestBuy, "found", "buy"), cell(bestSell, "found", "sell")]);
  return T.finish(best, "O(n)", "O(1)");
}
export const bestTimeToBuySell: AlgorithmDefinition<Values> = { id: STOCK_ID, parseInput: parseStock, run: runStock };

// ---------------------------------------------------------------- trapping rain water
export const RAIN_ID = "trapping-rain-water";
export function parseRain(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return any(parseChecked<Values>(raw, limits, { valueMin: 0, valueMax: 99, valueMessage: "Each height must be a whole number from 0 to 99.", noun: "height list" }, () => []));
}
export function runRain({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(RAIN_ID, { values: [...values] }, values, limits);
  const n = values.length;
  T.step({ type: "init" }, "entry", `Each value is the height of a wall. After rain, how much water is trapped between the walls of ${fmt(values)}? Water above a wall is limited by the shorter of the tallest walls on its left and right.`, {});
  let left = 0, right = n - 1, leftMax = 0, rightMax = 0, water = 0;
  T.step({ type: "init" }, "init", "Start two pointers at the outer walls, and remember the tallest wall seen from each side (0 at first).", { left, right, leftMax, rightMax, water }, { left, right });
  while (left < right) {
    T.step({ type: "init" }, "loop", `left (${left}) is still before right (${right}), so keep going.`, { left, right, leftMax, rightMax, water }, { left, right }, [cell(left, "active", "left"), cell(right, "active", "right")]);
    const goLeft = values[left]! < values[right]!;
    T.step({ type: "compare", a: indexRef(left), b: indexRef(right) }, "compare", goLeft ? `The left wall (${values[left]}) is shorter than the right wall (${values[right]}), so the left side decides how much water it holds.` : `The right wall (${values[right]}) is not taller than the left wall (${values[left]}), so the right side decides.`, { left, right, leftMax, rightMax, water }, { left, right }, [cell(left, goLeft ? "compared" : "active", "left"), cell(right, goLeft ? "active" : "compared", "right")]);
    if (goLeft) {
      const h = values[left]!;
      if (h >= leftMax) {
        leftMax = h;
        T.step({ type: "assign", target: indexRef(left), value: h }, "left-side", `${h} is at least as tall as every wall to its left, so no water sits on it. leftMax = ${leftMax}.`, { left, right, leftMax, rightMax, water }, { left, right }, [cell(left, "found", "left"), cell(right, "active", "right")], [left]);
      } else {
        water += leftMax - h;
        T.step({ type: "assign", target: indexRef(left), value: leftMax - h }, "left-side", `${h} is lower than leftMax ${leftMax}, so it holds ${leftMax} - ${h} = ${leftMax - h} water. Total water = ${water}.`, { left, right, leftMax, rightMax, water }, { left, right }, [cell(left, "created", `+${leftMax - h}`), cell(right, "active", "right")], [left]);
      }
      left++;
    } else {
      const h = values[right]!;
      if (h >= rightMax) {
        rightMax = h;
        T.step({ type: "assign", target: indexRef(right), value: h }, "right-side", `${h} is at least as tall as every wall to its right, so no water sits on it. rightMax = ${rightMax}.`, { left, right, leftMax, rightMax, water }, { left, right }, [cell(left, "active", "left"), cell(right, "found", "right")], [right]);
      } else {
        water += rightMax - h;
        T.step({ type: "assign", target: indexRef(right), value: rightMax - h }, "right-side", `${h} is lower than rightMax ${rightMax}, so it holds ${rightMax} - ${h} = ${rightMax - h} water. Total water = ${water}.`, { left, right, leftMax, rightMax, water }, { left, right }, [cell(left, "active", "left"), cell(right, "created", `+${rightMax - h}`)], [right]);
      }
      right--;
    }
  }
  T.step({ type: "done" }, "finish", `The pointers have met, so every wall has been handled. ${water} unit${water === 1 ? "" : "s"} of water are trapped.`, { water }, {}, values.map((_, k) => cell(k, "visited")));
  return T.finish(water, "O(n)", "O(1)");
}
export const trappingRainWater: AlgorithmDefinition<Values> = { id: RAIN_ID, parseInput: parseRain, run: runRain };

// ---------------------------------------------------------------- merge intervals
export const INTERVALS_ID = "merge-intervals";
export function parseIntervals(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { valueMin: 0, valueMax: 99, valueMessage: "Each interval end must be a whole number from 0 to 99.", noun: "interval list" }, ({ values }) => {
    if (values.length % 2 !== 0) return [{ field: "values", message: "Enter intervals as pairs: start, end, start, end, ..." }];
    for (let i = 0; i < values.length; i += 2) {
      if (values[i]! > values[i + 1]!) return [{ field: "values", message: "Each interval must start at or before its end." }];
      if (i >= 2 && values[i]! < values[i - 2]!) return [{ field: "values", message: "Intervals must be sorted by their start." }];
    }
    return [];
  });
}
export function runIntervals({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(INTERVALS_ID, { values: [...values] }, values, limits);
  const text = (a: number, b: number) => `[${a}, ${b}]`;
  T.step({ type: "init" }, "entry", `Merge overlapping intervals. The array holds start, end pairs sorted by start: ${fmt(values)}. Two intervals overlap when the next one starts no later than the current one ends.`, {});
  const out: number[] = [];
  if (values.length === 0) {
    T.step({ type: "notFound" }, "empty-check", "There are no intervals, so there is nothing to merge.", {});
    return T.finish([], "O(n)", "O(n)");
  }
  T.step({ type: "init" }, "empty-check", "There is at least one interval, so continue.", { intervals: values.length / 2 });
  let start = values[0]!;
  let end = values[1]!;
  T.step({ type: "init" }, "init", `Start with the first interval ${text(start, end)} as the one being built.`, { start, end }, { start: 0, end: 1 }, [cell(0, "active", "start"), cell(1, "active", "end")]);
  for (let i = 2; i < values.length; i += 2) {
    const s = values[i]!;
    const e = values[i + 1]!;
    const marks = [cell(i, "compared", "next"), cell(i + 1, "compared")];
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "loop", `Look at the next interval ${text(s, e)}.`, { i, start, end }, { i }, marks);
    if (s <= end) {
      const merged = Math.max(end, e);
      T.step({ type: "compare", a: indexRef(i), b: indexRef(i + 1) }, "overlap", `${s} is not after ${end}, so ${text(s, e)} overlaps ${text(start, end)}.`, { i, start, end }, { i }, marks);
      end = merged;
      T.step({ type: "assign", target: indexRef(i + 1), value: end }, "merge", `Merge them: the combined interval ends at the larger end, ${end}. Now building ${text(start, end)}.`, { i, start, end }, { i }, marks);
    } else {
      T.step({ type: "compare", a: indexRef(i), b: indexRef(i + 1) }, "overlap", `${s} is after ${end}, so there is a gap: ${text(s, e)} does not overlap ${text(start, end)}.`, { i, start, end }, { i }, marks);
      out.push(start, end);
      T.step({ type: "assign", target: indexRef(i), value: s }, "flush", `Finish ${text(start, end)} and add it to the result. Start building ${text(s, e)}.`, { i, start: s, end: e, merged: out.length / 2 }, { i }, marks);
      start = s;
      end = e;
    }
  }
  out.push(start, end);
  T.step({ type: "done" }, "finish", `Add the last interval ${text(start, end)}. Merged result: ${fmt(out)}.`, { merged: out.length / 2 });
  return T.finish(out, "O(n)", "O(n)");
}
export const mergeIntervals: AlgorithmDefinition<Values> = { id: INTERVALS_ID, parseInput: parseIntervals, run: runIntervals };

// ---------------------------------------------------------------- missing number
export const MISSING_ID = "missing-number";
export function parseMissing(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { valueMin: 0, valueMax: 15, valueMessage: "Each value must be a whole number from 0 to 15.", noun: "list" }, ({ values }) => {
    if (new Set(values).size !== values.length) return [{ field: "values", message: "Values must all be different." }];
    if (values.some((v) => v > values.length)) return [{ field: "values", message: `With ${values.length} values, every value must be between 0 and ${values.length}.` }];
    return [];
  });
}
export function runMissing({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new ArrayTrace(MISSING_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `The array holds ${n} different numbers taken from 0 to ${n}, so exactly one number is missing. Compare the sum it should have with the sum it has.`, { n });
  const expected = (n * (n + 1)) / 2;
  T.step({ type: "init" }, "init", `The numbers 0 to ${n} add up to ${n} × ${n + 1} / 2 = ${expected}. The running sum of the array starts at 0.`, { expected, sum: 0 });
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += values[i]!;
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "add", `Add ${values[i]}: sum = ${sum}.`, { i, expected, sum }, { i }, [...values.slice(0, i).map((_, k) => cell(k, "visited")), cell(i, "active", "i")]);
  }
  T.step({ type: "done" }, "finish", `The array adds up to ${sum}, so the missing number is ${expected} - ${sum} = ${expected - sum}.`, { expected, sum, missing: expected - sum }, {}, values.map((_, k) => cell(k, "visited")));
  return T.finish(expected - sum, "O(n)", "O(1)");
}
export const missingNumber: AlgorithmDefinition<Values> = { id: MISSING_ID, parseInput: parseMissing, run: runMissing };

// ---------------------------------------------------------------- find the duplicate (Floyd's cycle)
export const DUPLICATE_ID = "find-duplicate-floyd";
export function parseDuplicate(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 2, minLengthMessage: "Enter at least two values.", valueMin: 1, valueMax: 14, valueMessage: "Each value must be a whole number from 1 to 14." }, ({ values }) =>
    values.some((v) => v > values.length - 1) ? [{ field: "values", message: `With ${values.length} values, every value must be between 1 and ${values.length - 1}.` }] : [],
  );
}
export function runDuplicate({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(DUPLICATE_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `The array has ${values.length} values from 1 to ${values.length - 1}, so some value repeats. Treat each value as a pointer to the index it names. A repeated value means two indexes point to the same place, which makes the pointers loop.`, {});
  let slow = values[0]!;
  let fast = values[values[0]!]!;
  const at = (s: number, f: number) => [cell(s, "active", "slow"), ...(f === s ? [] : [cell(f, "compared", "fast")])];
  T.step({ type: "init" }, "init", `Start from index 0. slow takes one step (to ${slow}); fast takes two steps (to ${fast}).`, { slow, fast }, { slow, fast }, at(slow, fast));
  while (slow !== fast) {
    T.step({ type: "init" }, "phase1-loop", `slow (${slow}) and fast (${fast}) are at different places, so they have not met inside the loop yet.`, { slow, fast }, { slow, fast }, at(slow, fast));
    slow = values[slow]!;
    fast = values[values[fast]!]!;
    T.step({ type: "movePointer", pointer: "slow", to: indexRef(slow) }, "phase1-step", `slow moves one step to ${slow}; fast moves two steps to ${fast}.`, { slow, fast }, { slow, fast }, at(slow, fast));
  }
  T.step({ type: "init" }, "phase1-loop", `slow and fast are both at ${slow}: they met inside the loop.`, { slow, fast }, { slow, fast }, [cell(slow, "found", "meet")]);
  slow = 0;
  T.step({ type: "movePointer", pointer: "slow", to: indexRef(0) }, "reset", `Put slow back at index 0. The distance from index 0 to the start of the loop equals the distance from the meeting point to the start of the loop, so moving both one step at a time makes them meet exactly at the loop's entrance.`, { slow, fast }, { slow, fast }, at(slow, fast));
  while (slow !== fast) {
    T.step({ type: "init" }, "phase2-loop", `slow (${slow}) and fast (${fast}) differ, so step both once.`, { slow, fast }, { slow, fast }, at(slow, fast));
    slow = values[slow]!;
    fast = values[fast]!;
    T.step({ type: "movePointer", pointer: "slow", to: indexRef(slow) }, "phase2-step", `Both move one step: slow to ${slow}, fast to ${fast}.`, { slow, fast }, { slow, fast }, at(slow, fast));
  }
  T.step({ type: "found", element: indexRef(slow) }, "finish", `They meet at ${slow}. That is the loop's entrance, which is the repeated value: ${slow}.`, { duplicate: slow }, { slow }, [cell(slow, "found", "duplicate")].filter(() => slow < values.length));
  return T.finish(slow, "O(n)", "O(1)");
}
export const findDuplicateFloyd: AlgorithmDefinition<Values> = { id: DUPLICATE_ID, parseInput: parseDuplicate, run: runDuplicate };
