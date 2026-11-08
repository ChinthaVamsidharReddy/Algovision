import type { ExecutionTrace } from "@algovision/trace-schema";
import type { LimitProfile } from "../limits";
import { fmt, TreeTrace, type TreeValuesInput } from "./tree-common";

export type Order = "pre" | "post";
const NAME = { pre: "Pre-order", post: "Post-order" } as const;
const RULE = { pre: "the node first, then the left subtree, then the right subtree", post: "the left subtree, then the right subtree, then the node last" } as const;

/** Recursive depth-first traversal that visits the node before (pre) or after (post) its children. */
export function runTraversal(id: string, order: Order, input: TreeValuesInput, limits: LimitProfile): ExecutionTrace {
  const T = new TreeTrace(id, { values: [...input.values] }, input.values, limits);
  T.step({ type: "init" }, "entry", T.nodes.length === 0
    ? `The tree is empty. ${NAME[order]} traversal visits ${RULE[order]}, using recursion.`
    : `The values ${fmt(input.values)} were inserted into a binary search tree (smaller values go left, others go right). ${NAME[order]} traversal visits ${RULE[order]}, using recursion.`, { node: null, depth: 0 });
  const walk = (nid: string | null, anchor: string, side: string): void => {
    const parent = T.callStack.length > 0 ? T.value(T.top()) : null;
    T.call(nid, anchor, nid === null
      ? (anchor === "entry" ? "Call visit on the root. The tree is empty, so the root is null." : `Call visit on the ${side} child of ${parent}. There is none (null).`)
      : (anchor === "entry" ? `Call visit on the root, ${T.value(nid)}.` : `Call visit on the ${side} child of ${parent}, which is ${T.value(nid)}.`));
    if (nid === null) {
      T.ret(null, "base-case", "The node is null, so there is nothing to visit. Return to the caller.");
      return;
    }
    const n = T.node(nid);
    if (order === "pre") T.visit(nid, "visit", (out) => `Visit ${n.value} before its children: add it to the output, now ${fmt(out)}.`);
    walk(n.left, "go-left", "left");
    walk(n.right, "go-right", "right");
    if (order === "post") T.visit(nid, "visit", (out) => `Both subtrees of ${n.value} are done. Now visit ${n.value}: add it to the output, now ${fmt(out)}.`);
    const last = T.callStack.length === 1;
    T.ret(nid, "finish", last ? `This was the outermost call. The traversal is complete: ${fmt(T.output)}.` : `Done with ${n.value}. Return to the caller.`);
  };
  walk(T.root, "entry", "root");
  return T.finish([...T.output], "O(n)", "O(h)");
}
