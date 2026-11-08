import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { parseInts } from "./int-input";
import { CallTracer } from "./recursion-common";

export const ID = "factorial";
export const MAX_N = 12; // 12! = 479001600 still fits a 32-bit int
export interface FactorialInput { readonly n: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<FactorialInput> {
  return parseInts(raw, limits, [{ name: "n", label: "n", min: 0, max: MAX_N }]) as InputResult<FactorialInput>;
}

export function run(input: FactorialInput, limits: LimitProfile): ExecutionTrace {
  const t = new CallTracer(ID, { n: input.n }, limits);
  const fact = (n: number, top: boolean): number => {
    t.enter(n, "entry", top ? `Call factorial(${n}). Each call waits on the stack until the smaller call below it answers.` : `factorial(${n}) is called by factorial(${n + 1}).`, { n });
    if (n === 0) {
      t.note("base-case", "n is 0, so this is the base case: no more recursion is needed.", { n });
      t.leave("base-case", "Return 1 (0! is 1). This call leaves the stack.", { n, result: 1 });
      return 1;
    }
    t.note("base-case", `n is ${n}, not 0, so we need the answer for ${n - 1} first.`, { n });
    t.note("recurse", `Call factorial(${n - 1}) and wait for its answer.`, { n });
    const sub = fact(n - 1, false);
    const result = n * sub;
    t.leave("combine", `factorial(${n - 1}) returned ${sub}. Return ${n} * ${sub} = ${result}.`, { n, sub, result });
    return result;
  };
  const result = fact(input.n, true);
  return t.finish("combine", `Done: factorial(${input.n}) = ${result}.`, result, { n: input.n, result }, "O(n)", "O(n)");
}

export const factorial: AlgorithmDefinition<FactorialInput> = { id: ID, parseInput, run };
