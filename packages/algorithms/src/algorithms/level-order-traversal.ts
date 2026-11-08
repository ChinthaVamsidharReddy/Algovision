import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { fmt, parseTree, TreeTrace, type TreeValuesInput } from "./tree-common";

export const ID = "level-order-traversal";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<TreeValuesInput> {
  return parseTree(raw, limits) as InputResult<TreeValuesInput>;
}

/** Breadth-first traversal: a queue of nodes waiting to be visited, shown as "queued" highlights. */
export function run(input: TreeValuesInput, limits: LimitProfile): ExecutionTrace {
  const T = new TreeTrace(ID, { values: [...input.values] }, input.values, limits);
  const queue: string[] = [];
  const queued = () => queue.map((id) => ({ id, role: "pointer" as const, label: "queued" }));
  const q = () => `[${queue.map((id) => T.value(id)).join(", ")}]`;
  T.step({ type: "init" }, "entry", T.nodes.length === 0
    ? "The tree is empty, so there is nothing to visit."
    : `Visit ${fmt(input.values)} (as a binary search tree) level by level, top to bottom and left to right, using a queue.`, { queue: 0 });
  if (T.root === null) return T.finish([], "O(n)", "O(w)");
  queue.push(T.root);
  T.step({ type: "init" }, "enqueue-root", `Put the root, ${T.value(T.root)}, in the queue.`, { queue: queue.length }, queued());
  while (queue.length > 0) {
    T.step({ type: "init" }, "loop", `The queue is not empty (${q()}), so keep going.`, { queue: queue.length }, queued());
    const id = queue.shift()!;
    T.current = id;
    T.step({ type: "init" }, "dequeue", `Take ${T.value(id)} from the front of the queue.`, { node: T.value(id), queue: queue.length }, queued());
    T.visit(id, "visit", (out) => `Visit ${T.value(id)}: add it to the output, now ${fmt(out)}.`, { queue: queue.length });
    const n = T.node(id);
    if (n.left !== null) {
      queue.push(n.left);
      T.step({ type: "init" }, "enqueue-left", `${T.value(id)} has a left child, ${T.value(n.left)}. Add it to the back of the queue: ${q()}.`, { node: T.value(id), queue: queue.length }, queued());
    }
    if (n.right !== null) {
      queue.push(n.right);
      T.step({ type: "init" }, "enqueue-right", `${T.value(id)} has a right child, ${T.value(n.right)}. Add it to the back of the queue: ${q()}.`, { node: T.value(id), queue: queue.length }, queued());
    }
  }
  T.current = null;
  T.step({ type: "done" }, "finish", `The queue is empty. Level-order result: ${fmt(T.output)}.`, { queue: 0 });
  return T.finish([...T.output], "O(n)", "O(w)");
}
export const levelOrderTraversal: AlgorithmDefinition<TreeValuesInput> = { id: ID, parseInput, run };
