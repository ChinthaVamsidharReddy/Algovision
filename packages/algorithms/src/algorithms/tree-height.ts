import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { fmt, parseTree, TreeTrace, type TreeValuesInput } from "./tree-common";

export const ID = "tree-height";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<TreeValuesInput> {
  return parseTree(raw, limits) as InputResult<TreeValuesInput>;
}

export function run(input: TreeValuesInput, limits: LimitProfile): ExecutionTrace {
  const T = new TreeTrace(ID, { values: [...input.values] }, input.values, limits);
  T.step({ type: "init" }, "entry", T.nodes.length === 0
    ? "The tree is empty, so its height is 0. Height counts the nodes on the longest path from the root down."
    : `Find the height of the binary search tree built from ${fmt(input.values)}: the number of nodes on the longest root-to-leaf path.`, { node: null, depth: 0 });
  const h = (id: string | null, anchor: string, side: string): number => {
    const parent = T.callStack.length > 0 ? T.value(T.top()) : null;
    T.call(id, anchor, id === null
      ? (anchor === "entry" ? "Call height on the root. The tree is empty." : `Call height on the ${side} child of ${parent}. There is none (null).`)
      : (anchor === "entry" ? `Call height on the root, ${T.value(id)}.` : `Call height on the ${side} child of ${parent}, which is ${T.value(id)}.`));
    if (id === null) {
      T.ret(null, "base-case", "An empty subtree has height 0. Return 0.", { result: 0 });
      return 0;
    }
    const n = T.node(id);
    const left = h(n.left, "go-left", "left");
    const right = h(n.right, "go-right", "right");
    const result = 1 + Math.max(left, right);
    T.ret(id, "combine", `${n.value}: left height ${left}, right height ${right}. Return 1 + max(${left}, ${right}) = ${result}.`, { left, right, result });
    return result;
  };
  const result = h(T.root, "entry", "root");
  return T.finish(result, "O(n)", "O(h)");
}
export const treeHeight: AlgorithmDefinition<TreeValuesInput> = { id: ID, parseInput, run };
