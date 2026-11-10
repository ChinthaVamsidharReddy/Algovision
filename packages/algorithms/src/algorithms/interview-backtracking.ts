import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { ArrayTrace, cell, fmt, indexRef, parseChecked } from "./array-trace";
import { parseInts } from "./int-input";

interface Targeted { readonly values: readonly number[]; readonly target: number }
interface N { readonly n: number }

// ---------------------------------------------------------------- subset sum by backtracking
export const SUBSET_ID = "subset-sum-count";
export const MAX_SUBSET_ITEMS = 6;
export function parseSubset(raw: unknown, limits: LimitProfile): InputResult<Targeted> {
  return parseChecked<Targeted>(raw, limits, {
    noun: "number list", valueMin: 0, valueMax: 20, valueMessage: "Each number must be a whole number from 0 to 20.",
    maxLength: () => MAX_SUBSET_ITEMS,
    fields: [{ name: "target", label: "Target sum", min: () => 0, max: () => 60, rangeMessage: () => "Target sum must be between 0 and 60." }],
  }, () => []);
}
export function runSubset({ values, target }: Targeted, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new ArrayTrace(SUBSET_ID, { values: [...values], target }, values, limits);
  const chosen: number[] = [];
  let found = 0;
  const marks = (i: number) => [...chosen.map((k) => cell(k, "found", "in")), ...(i < n ? [cell(i, "active", "i")] : [])];
  T.step({ type: "init" }, "entry", `Count the subsets of ${fmt(values)} whose sum is exactly ${target}. For each number, try including it and try leaving it out (that is the backtracking), adding up as we go.`, { target });
  const walk = (i: number, sum: number): number => {
    if (sum > target) {
      T.step({ type: "init" }, "prune", `The sum ${sum} is already more than ${target} and every number is at least 0, so no choice below can fix it. Stop here (prune).`, { i, sum, target, found }, { i }, marks(i));
      return 0;
    }
    if (i === n) {
      const hit = sum === target ? 1 : 0;
      found += hit;
      T.step(hit && n > 0 ? { type: "found", element: indexRef(n - 1) } : hit ? { type: "done" } : { type: "notFound" }, "base-case", hit ? `Every number has been decided and the sum is ${sum}: this subset counts (total ${found}).` : `Every number has been decided but the sum is ${sum}, not ${target}.`, { i, sum, target, found }, {}, hit ? chosen.map((k) => cell(k, "found", "in")) : chosen.map((k) => cell(k, "compared", "in")));
      return hit;
    }
    T.step({ type: "init" }, "include", `Choose ${values[i]}: the sum becomes ${sum + values[i]!}.`, { i, sum, target, found }, { i }, marks(i));
    chosen.push(i);
    const withIt = walk(i + 1, sum + values[i]!);
    chosen.pop();
    T.step({ type: "init" }, "exclude", `Back at ${values[i]} with sum ${sum}: now leave it out.`, { i, sum, target, found }, { i }, marks(i));
    const without = walk(i + 1, sum);
    T.step({ type: "init" }, "finish", `Both choices for ${values[i]} are done: ${withIt} + ${without} = ${withIt + without} matching subset${withIt + without === 1 ? "" : "s"} from here.`, { i, sum, target, found }, { i }, marks(i));
    return withIt + without;
  };
  const total = walk(0, 0);
  return T.finish(total, "O(2^n)", "O(n)");
}
export const subsetSumCount: AlgorithmDefinition<Targeted> = { id: SUBSET_ID, parseInput: parseSubset, run: runSubset };

// ---------------------------------------------------------------- N-Queens
export const QUEENS_ID = "n-queens-count";
export const maxQueens = (l: LimitProfile) => (l.id === "lite" ? 4 : 5);
export function parseQueens(raw: unknown, limits: LimitProfile): InputResult<N> {
  return parseInts(raw, limits, [{ name: "n", label: "Board size n", min: 1, max: maxQueens }]) as InputResult<N>;
}
export function runQueens({ n }: N, limits: LimitProfile): ExecutionTrace {
  const cols = new Array<number>(n).fill(0);
  const T = new ArrayTrace(QUEENS_ID, { n }, cols, limits);
  let solutions = 0;
  const placed = (upTo: number) => cols.slice(0, upTo).map((c, r) => cell(r, "found", `c${c}`));
  T.step({ type: "init" }, "entry", `Count the ways to put ${n} queens on a ${n} × ${n} board so none attacks another. The array shows the column (1 to ${n}) of the queen in each row; 0 means no queen yet. Rows are filled top to bottom, and a dead end is undone (backtracking).`, { n });
  const attacker = (row: number, c: number): number => {
    for (let r = 0; r < row; r++) if (cols[r] === c + 1 || Math.abs(cols[r]! - (c + 1)) === row - r) return r;
    return -1;
  };
  const place = (row: number): number => {
    if (row === n) {
      solutions++;
      T.step({ type: "found", element: indexRef(n - 1) }, "solution", `All ${n} rows have a queen: ${fmt(cols)}. That is solution ${solutions}.`, { row, solutions }, {}, placed(n));
      return 1;
    }
    let total = 0;
    T.step({ type: "init" }, "row", `Fill row ${row}. Try each column from left to right.`, { row, solutions }, { row }, [...placed(row), cell(row, "active", "row")]);
    for (let c = 0; c < n; c++) {
      const by = attacker(row, c);
      T.step({ type: "init" }, "try", by < 0 ? `Column ${c + 1} in row ${row} is safe: no earlier queen shares its column or diagonal.` : `Column ${c + 1} in row ${row} is attacked by the queen in row ${by} (column ${cols[by]}), so skip it.`, { row, c: c + 1, solutions }, { row }, [...placed(row), cell(row, by < 0 ? "found" : "compared", `c${c + 1}`), ...(by < 0 ? [] : [cell(by, "compared", "attacks")])]);
      if (by < 0) {
        cols[row] = c + 1; T.values[row] = c + 1;
        T.step({ type: "assign", target: indexRef(row), value: c + 1 }, "place", `Place a queen in row ${row}, column ${c + 1}.`, { row, c: c + 1, solutions }, { row }, placed(row + 1), [row]);
        T.step({ type: "init" }, "recurse", `Go on to row ${row + 1}.`, { row, c: c + 1, solutions }, { row }, placed(row + 1));
        total += place(row + 1);
        cols[row] = 0; T.values[row] = 0;
        T.step({ type: "assign", target: indexRef(row), value: 0 }, "remove", `Take the queen back out of row ${row} and try the next column.`, { row, c: c + 1, solutions }, { row }, [...placed(row), cell(row, "active", "row")], [row]);
      }
    }
    T.step({ type: "init" }, "finish", `Row ${row} is done: ${total} solution${total === 1 ? "" : "s"} found below this position.`, { row, solutions, total }, { row }, placed(row));
    return total;
  };
  const total = place(0);
  return T.finish(total, "O(n!)", "O(n)");
}
export const nQueensCount: AlgorithmDefinition<N> = { id: QUEENS_ID, parseInput: parseQueens, run: runQueens };

// ---------------------------------------------------------------- generate parentheses
export const PARENS_ID = "generate-parentheses-count";
export const maxPairs = (l: LimitProfile) => (l.id === "lite" ? 3 : 4);
export function parseParens(raw: unknown, limits: LimitProfile): InputResult<N> {
  return parseInts(raw, limits, [{ name: "n", label: "Number of pairs", min: 1, max: maxPairs }]) as InputResult<N>;
}
export function runParens({ n }: N, limits: LimitProfile): ExecutionTrace {
  const s = new Array<number>(2 * n).fill(0);
  const T = new ArrayTrace(PARENS_ID, { n }, s, limits);
  let done = 0;
  const text = (upTo: number) => s.slice(0, upTo).map((x) => (x === 1 ? "(" : ")")).join("");
  const marks = (upTo: number) => s.slice(0, upTo).map((x, k) => cell(k, x === 1 ? "found" : "compared", x === 1 ? "(" : ")"));
  T.step({ type: "init" }, "entry", `Count the well-formed strings of ${n} pair${n === 1 ? "" : "s"} of parentheses. The array is the string being built: 1 means "(", 2 means ")", 0 means not placed yet. A "(" is allowed while fewer than ${n} are used; a ")" only while it closes an open one.`, { n });
  const build = (pos: number, open: number, close: number): number => {
    if (pos === 2 * n) {
      done++;
      T.step({ type: "found", element: indexRef(2 * n - 1) }, "complete", `The string "${text(pos)}" is complete and valid (number ${done}).`, { pos, open, close, done }, {}, marks(pos));
      return 1;
    }
    let total = 0;
    if (open < n) {
      s[pos] = 1; T.values[pos] = 1;
      T.step({ type: "assign", target: indexRef(pos), value: 1 }, "add-open", `Only ${open} of ${n} "(" used, so place "(" at position ${pos}: "${text(pos + 1)}".`, { pos, open, close, done }, { pos }, marks(pos + 1), [pos]);
      total += build(pos + 1, open + 1, close);
    }
    if (close < open) {
      s[pos] = 2; T.values[pos] = 2;
      T.step({ type: "assign", target: indexRef(pos), value: 2 }, "add-close", `There are ${open - close} unclosed "(", so place ")" at position ${pos}: "${text(pos + 1)}".`, { pos, open, close, done }, { pos }, marks(pos + 1), [pos]);
      total += build(pos + 1, open, close + 1);
    }
    s[pos] = 0; T.values[pos] = 0;
    T.step({ type: "assign", target: indexRef(pos), value: 0 }, "finish", `Both choices at position ${pos} are explored (${total} valid below). Clear it and go back.`, { pos, open, close, done }, { pos }, marks(pos), [pos]);
    return total;
  };
  const total = build(0, 0, 0);
  return T.finish(total, "O(4^n / √n)", "O(n)");
}
export const generateParenthesesCount: AlgorithmDefinition<N> = { id: PARENS_ID, parseInput: parseParens, run: runParens };
