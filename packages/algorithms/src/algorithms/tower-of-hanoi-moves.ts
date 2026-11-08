import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { parseInts } from "./int-input";
import { CallTracer } from "./recursion-common";

export const ID = "tower-of-hanoi-moves";
/** 3 steps per n=0 call (2^n of them), 5 per inner call (2^n - 1), plus the final step. */
const stepsFor = (n: number): number => 3 * 2 ** n + 5 * (2 ** n - 1) + 1;
export function maxN(limits: LimitProfile): number {
  let n = 1;
  while (n < 7 && stepsFor(n + 1) <= limits.maxSteps) n++;
  return n;
}
export interface HanoiInput { readonly n: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<HanoiInput> {
  return parseInts(raw, limits, [{ name: "n", label: "Number of disks", min: 1, max: maxN }]) as InputResult<HanoiInput>;
}

export function run(input: HanoiInput, limits: LimitProfile): ExecutionTrace {
  const t = new CallTracer(ID, { n: input.n }, limits);
  let moves = 0;
  const hanoi = (n: number): number => {
    t.enter(n, "entry", `Call hanoi(${n}): count the moves needed to shift ${n} disk${n === 1 ? "" : "s"}.`, { n });
    if (n === 0) {
      t.note("base-case", "There are no disks, so no moves are needed.", { n });
      t.leave("base-case", "Return 0.", { n, result: 0 });
      return 0;
    }
    t.note("base-case", `${n} disk${n === 1 ? "" : "s"} to move: first move the ${n - 1} above the biggest disk out of the way.`, { n });
    t.note("recurse-first", `Call hanoi(${n - 1}) to move the smaller stack aside.`, { n });
    const first = hanoi(n - 1);
    t.note("recurse-second", `That took ${first} move${first === 1 ? "" : "s"}. The biggest disk now moves once; then call hanoi(${n - 1}) to put the smaller stack back on top.`, { n, first });
    const second = hanoi(n - 1);
    moves = first + 1 + second;
    t.leave("move-disk", `Total for ${n} disk${n === 1 ? "" : "s"}: ${first} + 1 + ${second} = ${moves}.`, { n, first, second, result: moves });
    return moves;
  };
  const result = hanoi(input.n);
  return t.finish("move-disk", `Done: ${input.n} disk${input.n === 1 ? "" : "s"} need ${result} moves, which is 2^${input.n} - 1.`, result, { n: input.n, result }, "O(2^n)", "O(n)");
}

export const towerOfHanoiMoves: AlgorithmDefinition<HanoiInput> = { id: ID, parseInput, run };
