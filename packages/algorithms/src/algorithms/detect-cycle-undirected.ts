import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { adjacency, describeEdges, edgesOf, GraphTrace, list, parseGraph, ref, type GraphInput } from "./graph-common";

export const ID = "detect-cycle-undirected";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<GraphInput> {
  return parseGraph(raw, limits, { stride: 2, start: false, directed: false });
}

/** BFS that remembers each vertex's parent: meeting a seen vertex that is not the parent closes a cycle. */
export function run(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices } = input;
  const edges = edgesOf(values, 2);
  const adj = adjacency(vertices, edges, false);
  const G = new GraphTrace({ id: ID, input: { values: [...values], vertices }, vertices, edges, directed: false, weighted: false, frontierName: "Queue", markName: "Parent", limits });
  G.step({ type: "init" }, "entry", "Decide whether the graph contains a cycle. Search outward and remember how each vertex was reached; meeting an already-seen vertex by any other edge means a loop.", { vertices });
  G.step({ type: "init" }, "build-graph", `Store the edges (${describeEdges(edges, false, false)}) in an adjacency matrix. The graph has ${vertices} vertices numbered 0 to ${vertices - 1}.`, { vertices, edges: edges.length });
  G.step({ type: "init" }, "init-visited", "No vertex has been seen yet and none has a parent (shown as –).", { queueSize: 0 });
  const seen = new Array<boolean>(vertices).fill(false);
  const parent = new Array<number>(vertices).fill(-1);
  for (let s = 0; s < vertices; s++) {
    G.current = s;
    if (seen[s]) {
      G.step({ type: "init" }, "outer-loop", `Vertex ${s} was already reached from an earlier start, so skip it.`, { s });
      continue;
    }
    G.step({ type: "init" }, "outer-loop", `Vertex ${s} has not been reached, so start a new search there (the graph may have several separate pieces).`, { s });
    const queue: number[] = [s];
    seen[s] = true;
    G.visited.push(s);
    G.frontier = [...queue];
    G.step({ type: "enqueue", element: ref(s) }, "enqueue-start", `Mark ${s} as seen and queue it. It has no parent.`, { s, queueSize: queue.length }, [], [s]);
    while (queue.length > 0) {
      G.step({ type: "init" }, "loop", `The queue is not empty (${list(queue)}), so process the next vertex.`, { queueSize: queue.length });
      const u = queue.shift()!;
      G.frontier = [...queue];
      G.current = u;
      G.step({ type: "dequeue", element: ref(u) }, "dequeue", `Take ${u} from the front of the queue.${parent[u]! >= 0 ? ` It was reached from ${parent[u]}.` : ""}`, { u, parent: parent[u]!, queueSize: queue.length });
      const neighbors = adj[u]!.flatMap((w, v) => (w > 0 ? [v] : []));
      G.step({ type: "init" }, "neighbors-loop", neighbors.length === 0 ? `${u} has no neighbors.` : `Look at each neighbor of ${u} in increasing order: ${list(neighbors)}.`, { u });
      for (const v of neighbors) {
        G.activeEdge = { from: u, to: v };
        if (!seen[v]) {
          G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} is new, so reach it through ${u}.`, { u, v }, [{ v, role: "compared" }]);
          seen[v] = true;
          parent[v] = u;
          G.marks[v] = u;
          queue.push(v);
          G.visited.push(v);
          G.frontier = [...queue];
          G.step({ type: "enqueue", element: ref(v) }, "enqueue", `Mark ${v} as seen, record ${u} as its parent, and queue it.`, { u, v, queueSize: queue.length }, [{ v, role: "created" }], [v]);
          continue;
        }
        G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} has already been seen.`, { u, v }, [{ v, role: "compared" }]);
        if (v === parent[u]) {
          G.step({ type: "init" }, "cycle-check", `${v} is the parent of ${u}: this is just the edge we arrived by, not a cycle.`, { u, v, parent: parent[u]! }, [{ v, role: "compared" }]);
          continue;
        }
        G.step({ type: "init" }, "cycle-check", `${v} is already seen and is not the parent of ${u}, so there are two different routes to it.`, { u, v, parent: parent[u]! }, [{ v, role: "found" }]);
        G.output = [1];
        G.step({ type: "found", element: ref(v) }, "cycle-found", `Found a cycle through the edge ${u}–${v}. The graph is not a forest, so the answer is 1.`, { u, v, result: 1 }, [{ v, role: "found" }, { v: u, role: "found" }]);
        return G.finish(1, "O(V²)", "O(V)");
      }
      G.activeEdge = null;
    }
    G.step({ type: "init" }, "loop", `The queue is empty: the search that started at ${s} found no cycle.`, { s, queueSize: 0 });
  }
  G.current = null;
  G.activeEdge = null;
  G.output = [0];
  G.step({ type: "done" }, "finish", "Every piece of the graph was searched and no cycle was found, so the answer is 0.", { result: 0 });
  return G.finish(0, "O(V²)", "O(V)");
}
export const detectCycleUndirected: AlgorithmDefinition<GraphInput> = { id: ID, parseInput, run };
