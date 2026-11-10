import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { ArrayTrace, cell, fmt, indexRef, parseChecked } from "./array-trace";
import { parseInts } from "./int-input";

interface Values { readonly values: readonly number[] }
interface Targeted extends Values { readonly target: number }
const fieldRange = (name: string, label: string, lo: number, hi: number) => ({ name, label, min: () => lo, max: () => hi, rangeMessage: () => `${label} must be between ${lo} and ${hi}.` });

// ---------------------------------------------------------------- unique paths
export const PATHS_ID = "unique-paths";
interface Grid { readonly rows: number; readonly cols: number }
export function parsePaths(raw: unknown, limits: LimitProfile): InputResult<Grid> {
  return parseInts(raw, limits, [
    { name: "rows", label: "Number of rows", min: 1, max: (l) => l.maxArrayLength },
    { name: "cols", label: "Number of columns", min: 1, max: (l) => l.maxArrayLength },
  ]) as InputResult<Grid>;
}
export function runPaths({ rows, cols }: Grid, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(PATHS_ID, { rows, cols }, new Array<number>(cols).fill(1), limits);
  const dp = T.values;
  T.step({ type: "init" }, "entry", `Count the routes from the top-left to the bottom-right of a ${rows} × ${cols} grid moving only right or down. One array holds the current row: dp[j] is the number of routes to column j of this row.`, { rows, cols });
  T.step({ type: "init" }, "init", "In the first row there is exactly one route to every column (straight along the top).", { rows, cols }, {}, dp.map((_, j) => cell(j, "sorted")));
  for (let i = 1; i < rows; i++) {
    T.step({ type: "init" }, "row", `Move to row ${i}. Column 0 stays 1: there is only one way down the left edge.`, { rows, cols, i }, {}, [cell(0, "sorted", "edge")]);
    for (let j = 1; j < cols; j++) {
      const old = dp[j]!;
      dp[j] = dp[j]! + dp[j - 1]!;
      T.step({ type: "assign", target: indexRef(j), value: dp[j]! }, "fill", `dp[${j}] = ${old} (from above) + ${dp[j - 1]} (from the left) = ${dp[j]}.`, { rows, cols, i, j }, { j }, [cell(j, "created", "new"), cell(j - 1, "compared", "left")], [j]);
    }
  }
  T.step({ type: "found", element: indexRef(cols - 1) }, "finish", `There are ${dp[cols - 1]} routes to the bottom-right corner.`, { routes: dp[cols - 1]! }, {}, [cell(cols - 1, "found", "answer")]);
  return T.finish(dp[cols - 1]!, "O(rows × cols)", "O(cols)");
}
export const uniquePaths: AlgorithmDefinition<Grid> = { id: PATHS_ID, parseInput: parsePaths, run: runPaths };

// ---------------------------------------------------------------- coin change: number of ways
export const WAYS_ID = "coin-change-ways";
export const MAX_AMOUNT = 20;
interface Coins extends Values { readonly amount: number }
export function parseWays(raw: unknown, limits: LimitProfile): InputResult<Coins> {
  return parseChecked<Coins>(raw, limits, { noun: "coin list", valueMin: 1, valueMax: 99, valueMessage: "Each coin must be a whole number from 1 to 99.", fields: [fieldRange("amount", "Amount", 0, MAX_AMOUNT)] }, ({ values }) =>
    new Set(values).size === values.length ? [] : [{ field: "values", message: "Coins must all be different." }]);
}
export function runWays({ values: coins, amount }: Coins, limits: LimitProfile): ExecutionTrace {
  const dp = new Array<number>(amount + 1).fill(0);
  const T = new ArrayTrace(WAYS_ID, { values: [...coins], amount }, dp, limits);
  T.step({ type: "init" }, "entry", `Count the different combinations of the coins ${fmt(coins)} that make ${amount}. dp[a] is the number of combinations for amount a; coins are handled one at a time so the same set in a different order is not counted twice.`, { amount });
  dp[0] = 1; T.values[0] = 1;
  T.step({ type: "init" }, "init", "There is one way to make 0: use no coins. Every other amount starts at 0 ways.", { amount }, {}, [cell(0, "sorted", "base")]);
  for (const coin of coins) {
    T.step({ type: "init" }, "coin-loop", `Now allow the coin ${coin}.`, { amount, coin });
    for (let a = coin; a <= amount; a++) {
      T.values[a] = T.values[a]! + T.values[a - coin]!;
      T.step({ type: "assign", target: indexRef(a), value: T.values[a]! }, "fill", `dp[${a}] grows by dp[${a - coin}] = ${T.values[a - coin]}: every combination for ${a - coin} plus one ${coin}. Now ${T.values[a]}.`, { amount, coin, a }, { a }, [cell(a, "created", "new"), cell(a - coin, "compared", `-${coin}`)], [a]);
    }
  }
  T.step({ type: "found", element: indexRef(amount) }, "finish", `There are ${T.values[amount]} combination${T.values[amount] === 1 ? "" : "s"} that make ${amount}.`, { ways: T.values[amount]! }, {}, [cell(amount, "found", "answer")]);
  return T.finish(T.values[amount]!, "O(coins × amount)", "O(amount)");
}
export const coinChangeWays: AlgorithmDefinition<Coins> = { id: WAYS_ID, parseInput: parseWays, run: runWays };

// ---------------------------------------------------------------- subset sum (dp)
export const SUBSET_DP_ID = "subset-sum-dp";
export function parseSubsetDp(raw: unknown, limits: LimitProfile): InputResult<Targeted> {
  return parseChecked<Targeted>(raw, limits, { noun: "number list", valueMin: 1, valueMax: 20, valueMessage: "Each number must be a whole number from 1 to 20.", fields: [fieldRange("target", "Target sum", 0, 30)] }, () => []);
}
export function runSubsetDp({ values, target }: Targeted, limits: LimitProfile): ExecutionTrace {
  const dp = new Array<number>(target + 1).fill(0);
  const T = new ArrayTrace(SUBSET_DP_ID, { values: [...values], target }, dp, limits);
  T.step({ type: "init" }, "entry", `Can some of ${fmt(values)} add up to exactly ${target}? dp[s] is 1 when the sum s can be made from the numbers handled so far.`, { target });
  T.values[0] = 1;
  T.step({ type: "init" }, "init", "The sum 0 can always be made (take nothing).", { target }, {}, [cell(0, "sorted", "base")]);
  for (const v of values) {
    T.step({ type: "init" }, "item-loop", `Now allow the number ${v}. Sums are updated from high to low so ${v} is used at most once.`, { target, v });
    for (let s = target; s >= v; s--) {
      const was = T.values[s]!;
      if (T.values[s - v] === 1) T.values[s] = 1;
      T.step({ type: "assign", target: indexRef(s), value: T.values[s]! }, "fill", T.values[s - v] === 1 ? `Sum ${s - v} is reachable, so ${s} = ${s - v} + ${v} is reachable${was === 1 ? " (it already was)" : ""}.` : `Sum ${s - v} is not reachable, so ${s} does not become reachable through ${v}.`, { target, v, s }, { s }, [cell(s, T.values[s - v] === 1 ? "created" : "compared", "s"), cell(s - v, T.values[s - v] === 1 ? "found" : "compared")], T.values[s] !== was ? [s] : []);
    }
  }
  T.step(T.values[target] === 1 ? { type: "found", element: indexRef(target) } : { type: "notFound" }, "finish", T.values[target] === 1 ? `dp[${target}] is 1: yes, ${target} can be made.` : `dp[${target}] is 0: no subset adds up to ${target}.`, { reachable: T.values[target]! }, {}, [cell(target, T.values[target] === 1 ? "found" : "compared", "target")]);
  return T.finish(T.values[target]!, "O(n × target)", "O(target)");
}
export const subsetSumDp: AlgorithmDefinition<Targeted> = { id: SUBSET_DP_ID, parseInput: parseSubsetDp, run: runSubsetDp };

// ---------------------------------------------------------------- house robber II (circle)
export const ROBBER2_ID = "house-robber-circular";
export function parseRobber2(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one house.", valueMin: 0, valueMax: 999, valueMessage: "Each amount must be a whole number from 0 to 999.", noun: "house list" }, () => []);
}
export function runRobber2({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new ArrayTrace(ROBBER2_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `The houses ${fmt(values)} stand in a circle, so the first and last are neighbours and cannot both be robbed. Solve a straight street twice: once without the last house, once without the first.`, {});
  if (n === 1) {
    T.step({ type: "found", element: indexRef(0) }, "single", `With one house, rob it: ${values[0]}.`, {}, {}, [cell(0, "found")]);
    return T.finish(values[0]!, "O(n)", "O(1)");
  }
  T.step({ type: "init" }, "single", `There are ${n} houses, so the circle matters.`, { n });
  const street = (lo: number, hi: number, anchorCall: string, label: string): number => {
    T.step({ type: "init" }, anchorCall, `${label}: houses ${lo} to ${hi}.`, { lo, hi }, {}, Array.from({ length: hi - lo + 1 }, (_, k) => cell(lo + k, "pointer")));
    let prev = 0, cur = 0;
    for (let i = lo; i <= hi; i++) {
      const take = prev + values[i]!;
      const next = Math.max(cur, take);
      T.step({ type: "assign", target: indexRef(i), value: next }, "pick", `House ${i}: robbing it gives ${prev} + ${values[i]} = ${take}, skipping keeps ${cur}. Best so far: ${next}.`, { lo, hi, i, take, skip: cur, best: next }, { i }, [...Array.from({ length: hi - lo + 1 }, (_, k) => cell(lo + k, "pointer")), cell(i, take > cur ? "found" : "compared", take > cur ? "rob" : "skip")]);
      prev = cur; cur = next;
    }
    return cur;
  };
  const a = street(0, n - 2, "rob-first", "Street without the last house");
  const b = street(1, n - 1, "rob-second", "Street without the first house");
  const best = Math.max(a, b);
  T.step({ type: "done" }, "finish", `The better street gives ${best} (${a} versus ${b}).`, { a, b, best });
  return T.finish(best, "O(n)", "O(1)");
}
export const houseRobberCircular: AlgorithmDefinition<Values> = { id: ROBBER2_ID, parseInput: parseRobber2, run: runRobber2 };

// ---------------------------------------------------------------- min cost climbing stairs
export const CLIMB_ID = "min-cost-climbing-stairs";
export function parseClimb(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 2, minLengthMessage: "Enter at least two steps.", valueMin: 0, valueMax: 99, valueMessage: "Each cost must be a whole number from 0 to 99.", noun: "cost list" }, () => []);
}
export function runClimb({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new ArrayTrace(CLIMB_ID, { values: [...values] }, values, limits);
  const dp = T.values;
  T.step({ type: "init" }, "entry", `Each step costs ${fmt(values)} to step on, and you may start on step 0 or 1 and climb 1 or 2 steps at a time. The top is just past the last step. dp[i] is the cheapest total to stand on step i.`, {});
  T.step({ type: "init" }, "init", "Standing on step 0 or step 1 costs only that step's own price, because you may start on either.", {}, {}, [cell(0, "sorted", "start"), cell(1, "sorted", "start")]);
  for (let i = 2; i < n; i++) {
    const from = Math.min(dp[i - 1]!, dp[i - 2]!);
    dp[i] = values[i]! + from;
    T.step({ type: "assign", target: indexRef(i), value: dp[i]! }, "fill", `dp[${i}] = cost ${values[i]} + the cheaper way here (min of ${dp[i - 1]}, ${dp[i - 2]} = ${from}) = ${dp[i]}.`, { i, cost: values[i]!, best: dp[i]! }, { i }, [cell(i, "created", "new"), cell(i - 1, "compared"), cell(i - 2, "compared")], [i]);
  }
  const best = Math.min(dp[n - 1]!, dp[n - 2]!);
  T.step({ type: "found", element: indexRef(best === dp[n - 1] ? n - 1 : n - 2) }, "finish", `You can reach the top from either of the last two steps, so the answer is min(${dp[n - 2]}, ${dp[n - 1]}) = ${best}.`, { best }, {}, [cell(n - 2, "compared"), cell(n - 1, "compared")]);
  return T.finish(best, "O(n)", "O(n)");
}
export const minCostClimbingStairs: AlgorithmDefinition<Values> = { id: CLIMB_ID, parseInput: parseClimb, run: runClimb };

// ---------------------------------------------------------------- max product subarray
export const PRODUCT_ID = "max-product-subarray";
export function parseProduct(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one value.", valueMin: -4, valueMax: 4, valueMessage: "Each value must be a whole number from -4 to 4.", noun: "list" }, () => []);
}
export function runProduct({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(PRODUCT_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `Find the largest product of a run of neighbouring values in ${fmt(values)}. A negative value can turn the smallest product into the largest, so track both the biggest and the smallest product ending here.`, {});
  let hi = values[0]!, lo = values[0]!, best = values[0]!;
  T.step({ type: "init" }, "init", `Start with the first value ${hi} as the biggest, smallest and best product.`, { hi, lo, best }, { i: 0 }, [cell(0, "active", "i")]);
  for (let i = 1; i < values.length; i++) {
    const x = values[i]!;
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "loop", `Look at ${x}.`, { i, hi, lo, best }, { i }, [cell(i, "active", "i")]);
    const cands = [x, hi * x, lo * x];
    const nh = Math.max(...cands), nl = Math.min(...cands);
    hi = nh; lo = nl;
    T.step({ type: "assign", target: indexRef(i), value: hi }, "update", `The runs ending at ${i} have products ${x} (start fresh), ${cands[1]} and ${cands[2]}. Biggest = ${hi}, smallest = ${lo}.`, { i, hi, lo, best }, { i }, [cell(i, "created", "i")], [i]);
    if (hi > best) best = hi;
    T.step({ type: "compare", a: indexRef(i), b: indexRef(i) }, "best", hi >= best ? `${hi} is the best product so far.` : `The best product stays ${best}.`, { i, hi, lo, best }, { i }, [cell(i, "found", "best")]);
  }
  T.step({ type: "done" }, "finish", `The largest product of a run is ${best}.`, { best });
  return T.finish(best, "O(n)", "O(1)");
}
export const maxProductSubarray: AlgorithmDefinition<Values> = { id: PRODUCT_ID, parseInput: parseProduct, run: runProduct };

// ---------------------------------------------------------------- decode ways
export const DECODE_ID = "decode-ways";
export function parseDecode(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one digit.", valueMin: 0, valueMax: 9, valueMessage: "Each digit must be a whole number from 0 to 9.", noun: "digit list", maxLength: (l) => l.maxArrayLength }, () => []);
}
export function runDecode({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const dp = new Array<number>(n + 1).fill(0);
  const T = new ArrayTrace(DECODE_ID, { values: [...values] }, dp, limits);
  T.step({ type: "init" }, "entry", `The digits ${values.join("")} are a message encoded with A=1, B=2, ..., Z=26. How many ways can it be decoded? dp[i] is the number of ways to decode the first i digits.`, { n });
  T.values[0] = 1;
  T.values[1] = values[0] !== 0 ? 1 : 0;
  T.step({ type: "init" }, "init", `dp[0] = 1 (the empty message). dp[1] = ${T.values[1]}: the first digit ${values[0]} ${values[0] !== 0 ? "is a letter" : "is 0, which is not a letter"}.`, { n }, {}, [cell(0, "sorted"), cell(1, "sorted")]);
  for (let i = 2; i <= n; i++) {
    const one = values[i - 1]!, two = values[i - 2]! * 10 + values[i - 1]!;
    let ways = 0;
    if (one !== 0) ways += T.values[i - 1]!;
    if (two >= 10 && two <= 26) ways += T.values[i - 2]!;
    T.values[i] = ways;
    T.step({ type: "assign", target: indexRef(i), value: ways }, "fill", `Digit ${one} ${one !== 0 ? `alone adds dp[${i - 1}] = ${T.values[i - 1]}` : "alone is not a letter"}; the pair ${two} ${two >= 10 && two <= 26 ? `is a letter and adds dp[${i - 2}] = ${T.values[i - 2]}` : "is not a letter"}. dp[${i}] = ${ways}.`, { i, one, two, ways }, { i }, [cell(i, "created", "new"), cell(i - 1, one !== 0 ? "compared" : "visited"), cell(i - 2, two >= 10 && two <= 26 ? "compared" : "visited")], [i]);
  }
  T.step({ type: "found", element: indexRef(n) }, "finish", `The message can be decoded in ${T.values[n]} way${T.values[n] === 1 ? "" : "s"}.`, { ways: T.values[n]! }, {}, [cell(n, "found", "answer")]);
  return T.finish(T.values[n]!, "O(n)", "O(n)");
}
export const decodeWays: AlgorithmDefinition<Values> = { id: DECODE_ID, parseInput: parseDecode, run: runDecode };
