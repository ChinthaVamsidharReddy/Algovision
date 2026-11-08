import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { adjacency, describeEdges, edgesOf, GraphTrace, list, parseGraph, ref, type GraphInput } from "./graph-common";

export const ID = "topological-sort-kahn";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<GraphInput> {
  return parseGraph(raw, limits, { stride: 2, start: false, directed: true });
}

/** Kahn's algorithm: repeatedly remove a vertex with no remaining prerequisites. */
export function run(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices } = input;
  const edges = edgesOf(values, 2);
  const adj = adjacency(vertices, edges, true);
  const G = new GraphTrace({ id: ID, input: { values: [...values], vertices }, vertices, edges, directed: true, weighted: false, frontierName: "Queue", markName: "In-degree", limits });
  G.step({ type: "init" }, "entry", "Order the vertices so that every edge u→v has u before v. Vertices with no incoming edges can go first; removing them frees up the next ones.", { vertices });
  G.step({ type: "init" }, "build-graph", `Store the directed edges (${describeEdges(edges, true, false)}) in an adjacency matrix. The graph has ${vertices} vertices numbered 0 to ${vertices - 1}.`, { vertices, edges: edges.length });
  const indeg = new Array<number>(vertices).fill(0);
  for (let u = 0; u < vertices; u++) for (let v = 0; v < vertices; v++) if (adj[u]![v]! > 0) indeg[v]!++;
  G.marks = [...indeg];
  G.step({ type: "init" }, "compute-indegree", `Count the incoming edges of every vertex (its in-degree): ${list(indeg)}.`, { vertices });
  const queue: number[] = [];
  let anyZero = false;
  for (let v = 0; v < vertices; v++) {
    if (indeg[v] !== 0) continue;
    anyZero = true;
    queue.push(v);
    G.frontier = [...queue];
    G.step({ type: "enqueue", element: ref(v) }, "enqueue-zero", `${v} has in-degree 0, so nothing has to come before it. Queue it.`, { v, queueSize: queue.length }, [{ v, role: "created" }], [v]);
  }
  if (!anyZero) G.step({ type: "init" }, "enqueue-zero", "No vertex has in-degree 0, so there is nothing to start with.", { queueSize: 0 });
  while (queue.length > 0) {
    G.step({ type: "init" }, "loop", `The queue is not empty (${list(queue)}), so a vertex is ready to be placed.`, { queueSize: queue.length });
    const u = queue.shift()!;
    G.frontier = [...queue];
    G.current = u;
    G.step({ type: "dequeue", element: ref(u) }, "dequeue", `Take ${u} from the front of the queue.`, { u, queueSize: queue.length });
    G.output.push(u);
    G.visited.push(u);
    G.step({ type: "visit", element: ref(u) }, "emit", `Place ${u} next in the order: ${list(G.output)}.`, { u, placed: G.output.length }, [], [u]);
    const outs = adj[u]!.flatMap((w, v) => (w > 0 ? [v] : []));
    G.step({ type: "init" }, "neighbors-loop", outs.length === 0 ? `${u} has no outgoing edges.` : `Remove ${u}: look at each vertex it points to, in increasing order: ${list(outs)}.`, { u });
    for (const v of outs) {
      G.activeEdge = { from: u, to: v };
      G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `The edge ${u}→${v} is removed along with ${u}.`, { u, v }, [{ v, role: "compared" }]);
      indeg[v]!--;
      G.marks[v] = indeg[v]!;
      G.step({ type: "assign", target: ref(v), value: indeg[v]! }, "decrement", `${v} now has ${indeg[v]} incoming edge${indeg[v] === 1 ? "" : "s"} left.`, { u, v, indegree: indeg[v]! }, [{ v, role: "compared" }], [v]);
      if (indeg[v] === 0) {
        queue.push(v);
        G.frontier = [...queue];
        G.step({ type: "enqueue", element: ref(v) }, "enqueue", `${v} has no prerequisites left. Queue it: ${list(queue)}.`, { u, v, queueSize: queue.length }, [{ v, role: "created" }], [v]);
      }
    }
    G.activeEdge = null;
  }
  G.current = null;
  G.step({ type: "init" }, "loop", "The queue is empty.", { queueSize: 0 });
  const order = [...G.output];
  if (order.length < vertices) {
    G.step({ type: "notFound" }, "cycle-check", `Only ${order.length} of ${vertices} vertices were placed. The rest each wait on another one of them.`, { placed: order.length, vertices });
    G.output = [];
    G.step({ type: "notFound" }, "cycle-found", "The remaining vertices form a cycle, so no valid order exists. Return an empty order.", { result: 0 });
    return G.finish([], "O(V²)", "O(V)");
  }
  G.step({ type: "init" }, "cycle-check", `All ${vertices} vertices were placed, so there is no cycle.`, { placed: order.length, vertices });
  G.step({ type: "done" }, "finish", `A valid topological order: ${list(order)}.`, { count: order.length });
  return G.finish(order, "O(V²)", "O(V)");
}
export const topologicalSortKahn: AlgorithmDefinition<GraphInput> = { id: ID, parseInput, run };
