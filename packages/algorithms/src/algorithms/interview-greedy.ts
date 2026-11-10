import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { ArrayTrace, cell, fmt, indexRef, parseChecked } from "./array-trace";

interface Values { readonly values: readonly number[] }
const jumpSpec = { minLength: 1, minLengthMessage: "Enter at least one value.", valueMin: 0, valueMax: 9, valueMessage: "Each jump length must be a whole number from 0 to 9.", noun: "jump list" };
const reachCells = (reach: number, n: number) => Array.from({ length: Math.min(reach, n - 1) + 1 }, (_, k) => cell(k, "pointer"));

// ---------------------------------------------------------------- jump game
export const JUMP_ID = "jump-game";
export const parseJump = (raw: unknown, limits: LimitProfile): InputResult<Values> => parseChecked<Values>(raw, limits, jumpSpec, () => []);
export function runJump({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new ArrayTrace(JUMP_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `Each value is the longest jump allowed from that index. Can you get from index 0 to the last index ${n - 1} of ${fmt(values)}? Track the farthest index reachable so far.`, {});
  let reach = 0;
  T.step({ type: "init" }, "init", "So far only index 0 is reachable: reach = 0.", { reach }, {}, reachCells(reach, n));
  for (let i = 0; i < n; i++) {
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "loop", `Visit index ${i}.`, { i, reach }, { i }, [...reachCells(reach, n), cell(i, "active", "i")]);
    if (i > reach) {
      T.step({ type: "notFound" }, "stuck", `Index ${i} is beyond the farthest reachable index ${reach}, so you can never get there. The last index is unreachable.`, { i, reach }, { i }, [...reachCells(reach, n), cell(i, "compared", "gap")]);
      return T.finish(0, "O(n)", "O(1)");
    }
    reach = Math.max(reach, i + values[i]!);
    T.step({ type: "assign", target: indexRef(i), value: reach }, "extend", `From ${i} you can jump up to ${values[i]}, reaching index ${i + values[i]!}. The farthest reachable index is now ${reach}.`, { i, reach }, { i }, [...reachCells(reach, n), cell(i, "active", "i")]);
  }
  T.step({ type: "found", element: indexRef(n - 1) }, "finish", `Every index was reachable, including the last one. The answer is yes (1).`, { reach }, {}, values.map((_, k) => cell(k, "found")));
  return T.finish(1, "O(n)", "O(1)");
}
export const jumpGame: AlgorithmDefinition<Values> = { id: JUMP_ID, parseInput: parseJump, run: runJump };

// ---------------------------------------------------------------- minimum jumps
export const MINJUMP_ID = "min-jumps-to-end";
export const parseMinJumps = (raw: unknown, limits: LimitProfile): InputResult<Values> => parseChecked<Values>(raw, limits, jumpSpec, () => []);
export function runMinJumps({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new ArrayTrace(MINJUMP_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `Find the fewest jumps from index 0 to the last index of ${fmt(values)}, or -1 if it cannot be done. Think in rounds: each jump takes you somewhere inside the current reach, and the next round's reach is the farthest point seen.`, {});
  if (n <= 1) {
    T.step({ type: "done" }, "single", "You are already on the last index, so 0 jumps are needed.", {}, {}, [cell(0, "found")]);
    return T.finish(0, "O(n)", "O(1)");
  }
  T.step({ type: "init" }, "single", `There are ${n} indexes, so at least one jump is needed.`, { n });
  let jumps = 0, curEnd = 0, farthest = 0;
  T.step({ type: "init" }, "init", "No jumps yet. The current round reaches index 0 only; the farthest seen is 0.", { jumps, curEnd, farthest }, {}, [cell(0, "pointer")]);
  for (let i = 0; i < n - 1; i++) {
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "loop", `Visit index ${i}.`, { i, jumps, curEnd, farthest }, { i }, [...reachCells(curEnd, n), cell(i, "active", "i")]);
    farthest = Math.max(farthest, i + values[i]!);
    T.step({ type: "assign", target: indexRef(i), value: farthest }, "extend", `From ${i} you can reach index ${i + values[i]!}. The farthest seen is ${farthest}.`, { i, jumps, curEnd, farthest }, { i }, [...reachCells(curEnd, n), cell(i, "active", "i")]);
    const atEdge = i === curEnd;
    T.step({ type: "compare", a: indexRef(i), b: indexRef(i) }, "boundary", atEdge ? `${i} is the end of the current round, so another jump must be taken.` : `${i} is inside the current round (it ends at ${curEnd}); no new jump yet.`, { i, jumps, curEnd, farthest }, { i }, [...reachCells(curEnd, n), cell(i, atEdge ? "found" : "compared", "i")]);
    if (atEdge) {
      jumps++;
      curEnd = farthest;
      T.step({ type: "assign", target: indexRef(i), value: jumps }, "jump", `Take jump ${jumps}. The next round reaches up to index ${curEnd}.`, { i, jumps, curEnd, farthest }, { i }, [...reachCells(curEnd, n), cell(i, "found", "jump")]);
      if (curEnd >= n - 1) {
        T.step({ type: "found", element: indexRef(n - 1) }, "finish", `The reach covers the last index, so ${jumps} jump${jumps === 1 ? "" : "s"} are enough.`, { jumps }, {}, [cell(n - 1, "found", "end")]);
        return T.finish(jumps, "O(n)", "O(1)");
      }
    }
  }
  T.step({ type: "notFound" }, "unreachable", "The loop ended without the reach covering the last index, so it cannot be reached.", { jumps, curEnd }, {}, reachCells(curEnd, n));
  return T.finish(-1, "O(n)", "O(1)");
}
export const minJumpsToEnd: AlgorithmDefinition<Values> = { id: MINJUMP_ID, parseInput: parseMinJumps, run: runMinJumps };

// ---------------------------------------------------------------- activity selection
export const ACTIVITY_ID = "activity-selection";
export function parseActivity(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { valueMin: 0, valueMax: 99, valueMessage: "Each time must be a whole number from 0 to 99.", noun: "activity list" }, ({ values }) => {
    if (values.length % 2 !== 0) return [{ field: "values", message: "Enter activities as pairs: start, end, start, end, ..." }];
    for (let i = 0; i < values.length; i += 2) {
      if (values[i]! >= values[i + 1]!) return [{ field: "values", message: "Each activity must end after it starts." }];
      if (i >= 2 && values[i + 1]! < values[i - 1]!) return [{ field: "values", message: "Activities must be sorted by their end time." }];
    }
    return [];
  });
}
export function runActivity({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(ACTIVITY_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `Pick as many activities as possible with no overlap. The array holds start, end pairs sorted by end time: ${fmt(values)}. Always take the activity that finishes first among those that fit; it leaves the most room for the rest.`, {});
  let count = 0;
  let lastEnd = -1;
  T.step({ type: "init" }, "init", "Nothing chosen yet, so the last chosen end time is -1 (before everything).", { count, lastEnd });
  const chosen: number[] = [];
  for (let i = 0; i < values.length; i += 2) {
    const s = values[i]!, e = values[i + 1]!;
    const marks = [...chosen.flatMap((c) => [cell(c, "found"), cell(c + 1, "found")]), cell(i, "active", "start"), cell(i + 1, "active", "end")];
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "loop", `Consider the activity from ${s} to ${e}.`, { i, start: s, end: e, count, lastEnd }, { i }, marks);
    if (s >= lastEnd) {
      count++;
      lastEnd = e;
      chosen.push(i);
      T.step({ type: "compare", a: indexRef(i), b: indexRef(i + 1) }, "check", `It starts at ${s}, which is not before the last chosen end, so it fits.`, { i, start: s, end: e, count, lastEnd }, { i }, marks);
      T.step({ type: "assign", target: indexRef(i + 1), value: e }, "select", `Choose it: count = ${count}, and the last chosen end time is now ${lastEnd}.`, { i, count, lastEnd }, { i }, [...chosen.flatMap((c) => [cell(c, "found"), cell(c + 1, "found")])], [i, i + 1]);
    } else {
      T.step({ type: "compare", a: indexRef(i), b: indexRef(i + 1) }, "check", `It starts at ${s}, before the last chosen end ${lastEnd}, so it overlaps and is skipped.`, { i, start: s, end: e, count, lastEnd }, { i }, [...chosen.flatMap((c) => [cell(c, "found"), cell(c + 1, "found")]), cell(i, "compared", "skip"), cell(i + 1, "compared")]);
    }
  }
  T.step({ type: "done" }, "finish", `${count} activit${count === 1 ? "y" : "ies"} can be chosen without overlap.`, { count }, {}, chosen.flatMap((c) => [cell(c, "found"), cell(c + 1, "found")]));
  return T.finish(count, "O(n)", "O(1)");
}
export const activitySelection: AlgorithmDefinition<Values> = { id: ACTIVITY_ID, parseInput: parseActivity, run: runActivity };
