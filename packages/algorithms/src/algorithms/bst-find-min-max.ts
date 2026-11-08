import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { fmt, parseTree, TreeTrace, type TreeValuesInput } from "./tree-common";

export const ID = "bst-find-min-max";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<TreeValuesInput> {
  return parseTree(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one value." }) as InputResult<TreeValuesInput>;
}

export function run(input: TreeValuesInput, limits: LimitProfile): ExecutionTrace {
  const T = new TreeTrace(ID, { values: [...input.values] }, input.values, limits);
  T.step({ type: "init" }, "entry", `In the binary search tree built from ${fmt(input.values)}, the smallest value is the leftmost node and the largest is the rightmost node.`, {});
  for (const phase of ["min", "max"] as const) {
    const side = phase === "min" ? "left" : "right";
    T.current = T.root;
    T.step({ type: "init" }, phase === "min" ? "init-min" : "init-max", `Start at the root, ${T.value(T.root)}, and keep going ${side} to find the ${phase === "min" ? "smallest" : "largest"} value.`, { current: T.value(T.root) });
    for (;;) {
      const cur = T.current!;
      const next = T.node(cur)[side];
      T.step({ type: "init" }, phase === "min" ? "loop-min" : "loop-max",
        next === null ? `${T.value(cur)} has no ${side} child, so we have reached the end.` : `${T.value(cur)} has a ${side} child, ${T.value(next)}, so keep going.`,
        { current: T.value(cur) }, [{ id: cur, role: next === null ? "compared" : "active", label: "current" }]);
      if (next === null) break;
      T.current = next;
      T.step({ type: "init" }, side === "left" ? "go-left" : "go-right", `Move ${side} to ${T.value(next)}.`, { current: T.value(next) });
    }
    T.visit(T.current!, phase === "min" ? "record-min" : "record-max", (out) => `The ${phase === "min" ? "minimum" : "maximum"} is ${T.value(T.current)}. Output so far: ${fmt(out)}.`, { current: T.value(T.current) });
  }
  T.current = null;
  T.step({ type: "done" }, "finish", `Done. Minimum ${T.output[0]}, maximum ${T.output[1]}.`, {});
  return T.finish([...T.output], "O(h)", "O(1)");
}
export const bstFindMinMax: AlgorithmDefinition<TreeValuesInput> = { id: ID, parseInput, run };
