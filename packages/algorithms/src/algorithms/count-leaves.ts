import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { fmt, parseTree, TreeTrace, type TreeValuesInput } from "./tree-common";

export const ID = "count-leaves";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<TreeValuesInput> {
  return parseTree(raw, limits) as InputResult<TreeValuesInput>;
}

export function run(input: TreeValuesInput, limits: LimitProfile): ExecutionTrace {
  const T = new TreeTrace(ID, { values: [...input.values] }, input.values, limits);
  T.step({ type: "init" }, "entry", T.nodes.length === 0
    ? "The tree is empty, so it has no leaves. A leaf is a node with no children."
    : `Count the leaves (nodes with no children) of the binary search tree built from ${fmt(input.values)}.`, { node: null, depth: 0 });
  const count = (id: string | null, anchor: string, side: string): number => {
    const parent = T.callStack.length > 0 ? T.value(T.top()) : null;
    T.call(id, anchor, id === null
      ? (anchor === "entry" ? "Call countLeaves on the root. The tree is empty." : `Call countLeaves on the ${side} child of ${parent}. There is none (null).`)
      : (anchor === "entry" ? `Call countLeaves on the root, ${T.value(id)}.` : `Call countLeaves on the ${side} child of ${parent}, which is ${T.value(id)}.`));
    if (id === null) {
      T.ret(null, "base-case", "An empty subtree has no leaves. Return 0.", { result: 0 });
      return 0;
    }
    const n = T.node(id);
    if (n.left === null && n.right === null) {
      T.ret(id, "check-leaf", `${n.value} has no children, so it is a leaf. Return 1.`, { result: 1 });
      return 1;
    }
    T.step({ type: "init" }, "check-leaf", `${n.value} has at least one child, so it is not a leaf. Count the leaves below it.`, { node: n.value });
    const left = count(n.left, "go-left", "left");
    const right = count(n.right, "go-right", "right");
    T.ret(id, "combine", `${n.value}: ${left} leaves on the left plus ${right} on the right. Return ${left + right}.`, { left, right, result: left + right });
    return left + right;
  };
  const result = count(T.root, "entry", "root");
  return T.finish(result, "O(n)", "O(h)");
}
export const countLeaves: AlgorithmDefinition<TreeValuesInput> = { id: ID, parseInput, run };
