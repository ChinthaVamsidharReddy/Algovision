import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { parseInts } from "./int-input";
import { CallTracer } from "./recursion-common";

export const ID = "power-fast-exponentiation";
export interface PowerInput { readonly base: number; readonly exp: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<PowerInput> {
  return parseInts(raw, limits, [
    { name: "base", label: "Base", min: -9, max: 9 },
    { name: "exp", label: "Exponent", min: 0, max: 9 },
  ]) as InputResult<PowerInput>;
}

export function run(input: PowerInput, limits: LimitProfile): ExecutionTrace {
  const { base } = input;
  const t = new CallTracer(ID, { base, exp: input.exp }, limits);
  const power = (exp: number): number => {
    t.enter(exp, "entry", `Call power(${base}, ${exp}). The stack shows each call's exponent.`, { base, exp });
    if (exp === 0) {
      t.note("base-case", "The exponent is 0, so the answer is 1 (anything to the power 0).", { base, exp });
      t.leave("base-case", "Return 1.", { base, exp, result: 1 });
      return 1;
    }
    t.note("base-case", `The exponent is ${exp}, not 0. Solve for half the exponent (${Math.floor(exp / 2)}) and square it.`, { base, exp });
    t.note("recurse", `Call power(${base}, ${Math.floor(exp / 2)}) for the half-size problem.`, { base, exp });
    const half = power(Math.floor(exp / 2));
    if (exp % 2 === 0) {
      const result = half * half;
      t.leave("combine-even", `The exponent is even, so square the half answer: ${half} * ${half} = ${result}.`, { base, exp, half, result });
      return result;
    }
    const result = half * half * base;
    t.leave("combine-odd", `The exponent is odd, so square the half answer and multiply by the base once more: ${half} * ${half} * ${base} = ${result}.`, { base, exp, half, result });
    return result;
  };
  const result = power(input.exp);
  const last = input.exp === 0 ? "base-case" : input.exp % 2 === 0 ? "combine-even" : "combine-odd";
  return t.finish(last, `Done: ${base}^${input.exp} = ${result}, using only about log2(${input.exp}) multiplications' worth of calls.`, result, { base, exp: input.exp, result }, "O(log n)", "O(log n)");
}

export const powerFastExponentiation: AlgorithmDefinition<PowerInput> = { id: ID, parseInput, run };
