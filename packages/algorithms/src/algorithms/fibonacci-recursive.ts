import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { parseInts } from "./int-input";
import { CallTracer } from "./recursion-common";

export const ID = "fibonacci-recursive";
/** Steps: 3 per leaf call, 5 per inner call, plus the final step. A leaf is a call with n <= 1. */
function stepsFor(n: number): number {
  let a = 1, b = 1; // leaves(0)=1, leaves(1)=1
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  const leaves = n === 0 ? 1 : b;
  return 3 * leaves + 5 * (leaves - 1) + 1;
}
export function maxN(limits: LimitProfile): number {
  let n = 0;
  while (n < 9 && stepsFor(n + 1) <= limits.maxSteps) n++;
  return n;
}
export interface FibInput { readonly n: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<FibInput> {
  return parseInts(raw, limits, [{ name: "n", label: "n", min: 0, max: maxN }]) as InputResult<FibInput>;
}

export function run(input: FibInput, limits: LimitProfile): ExecutionTrace {
  const t = new CallTracer(ID, { n: input.n }, limits);
  const fib = (n: number): number => {
    t.enter(n, "entry", `Call fib(${n}).`, { n });
    if (n <= 1) {
      t.note("base-case", `n is ${n}, so this is a base case: fib(${n}) is ${n}.`, { n });
      t.leave("base-case", `Return ${n}.`, { n, result: n });
      return n;
    }
    t.note("base-case", `n is ${n}, so we need fib(${n - 1}) and fib(${n - 2}).`, { n });
    t.note("recurse-left", `Call fib(${n - 1}) first (the left branch).`, { n });
    const left = fib(n - 1);
    t.note("recurse-right", `fib(${n - 1}) returned ${left}. Now call fib(${n - 2}) (the right branch).`, { n, left });
    const right = fib(n - 2);
    const result = left + right;
    t.leave("combine", `Both answers are in: ${left} + ${right} = ${result}. Return ${result}.`, { n, left, right, result });
    return result;
  };
  const result = fib(input.n);
  return t.finish("combine", `Done: fib(${input.n}) = ${result}. The same small values were recomputed many times, which is why this version is slow.`, result, { n: input.n, result }, "O(2^n)", "O(n)");
}

export const fibonacciRecursive: AlgorithmDefinition<FibInput> = { id: ID, parseInput, run };
