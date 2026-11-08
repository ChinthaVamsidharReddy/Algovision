import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { parseInts } from "./int-input";
import { CallTracer } from "./recursion-common";

export const ID = "sum-of-digits-recursive";
export const MAX_N = 999999;
export interface DigitsInput { readonly n: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<DigitsInput> {
  return parseInts(raw, limits, [{ name: "n", label: "n", min: 0, max: MAX_N }]) as InputResult<DigitsInput>;
}

export function run(input: DigitsInput, limits: LimitProfile): ExecutionTrace {
  const t = new CallTracer(ID, { n: input.n }, limits);
  const sum = (n: number): number => {
    t.enter(n, "entry", `Call sumDigits(${n}).`, { n });
    if (n < 10) {
      t.note("base-case", `${n} has a single digit, so the base case applies.`, { n });
      t.leave("base-case", `Return ${n}.`, { n, result: n });
      return n;
    }
    t.note("base-case", `${n} has more than one digit. Split off the last digit (${n % 10}) and recurse on the rest (${Math.floor(n / 10)}).`, { n });
    t.note("recurse", `Call sumDigits(${Math.floor(n / 10)}).`, { n });
    const rest = sum(Math.floor(n / 10));
    const result = (n % 10) + rest;
    t.leave("combine", `The other digits sum to ${rest}. Return ${n % 10} + ${rest} = ${result}.`, { n, rest, result });
    return result;
  };
  const result = sum(input.n);
  return t.finish(input.n < 10 ? "base-case" : "combine", `Done: the digits of ${input.n} add up to ${result}.`, result, { n: input.n, result }, "O(log n)", "O(log n)");
}

export const sumOfDigitsRecursive: AlgorithmDefinition<DigitsInput> = { id: ID, parseInput, run };
