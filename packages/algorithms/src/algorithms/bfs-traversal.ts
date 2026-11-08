import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { adjacency, describeEdges, edgesOf, GraphTrace, list, parseGraph, ref, type GraphInput } from "./graph-common";

export const ID = "bfs-traversal";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<GraphInput> {
  return parseGraph(raw, limits, { stride: 2, start: true, directed: false });
}

export function run(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices, start } = input;
  const edges = edgesOf(values, 2);
  const adj = adjacency(vertices, edges, false);
  const G = new GraphTrace({ id: ID, input: { values: [...values], vertices, start }, vertices, edges, directed: false, weighted: false, frontierName: "Queue", markName: "", limits });
  G.step({ type: "init" }, "entry", `Visit every vertex reachable from ${start} in breadth-first order: first ${start}, then its neighbors, then their neighbors, level by level.`, { start });
  G.step({ type: "init" }, "build-graph", `Store the edges (${describeEdges(edges, false, false)}) in an adjacency matrix so we can ask "are u and v joined?" quickly. The graph has ${vertices} vertices numbered 0 to ${vertices - 1}.`, { vertices, edges: edges.length });
  G.step({ type: "init" }, "init-visited", "Create the queue and a seen flag for every vertex. Nothing has been seen yet.", { queueSize: 0 });
  const seen = new Array<boolean>(vertices).fill(false);
  const queue: number[] = [];
  seen[start] = true;
  queue.push(start);
  G.visited.push(start);
  G.frontier = [...queue];
  G.step({ type: "enqueue", element: ref(start) }, "enqueue-start", `Mark ${start} as seen and put it in the queue. It is where the search begins.`, { start, queueSize: queue.length }, [], [start]);
  while (queue.length > 0) {
    G.step({ type: "init" }, "loop", `The queue is not empty (${list(queue)}), so there is still a vertex to process.`, { queueSize: queue.length });
    const u = queue.shift()!;
    G.frontier = [...queue];
    G.current = u;
    G.step({ type: "dequeue", element: ref(u) }, "dequeue", `Take ${u} from the front of the queue. The oldest discovered vertex is processed first.`, { u, queueSize: queue.length });
    G.output.push(u);
    G.step({ type: "visit", element: ref(u) }, "visit", `Visit ${u}: add it to the visit order, which is now ${list(G.output)}.`, { u, queueSize: queue.length }, [], [u]);
    const neighbors = adj[u]!.flatMap((w, v) => (w > 0 ? [v] : []));
    G.step({ type: "init" }, "neighbors-loop", neighbors.length === 0 ? `${u} has no neighbors.` : `Look at each neighbor of ${u} in increasing order: ${list(neighbors)}.`, { u });
    for (const v of neighbors) {
      G.activeEdge = { from: u, to: v };
      if (seen[v]) {
        G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} was already seen, so skip it. This is what keeps the search from going in circles.`, { u, v }, [{ v, role: "compared" }]);
        continue;
      }
      G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} has not been seen yet, so it is newly discovered.`, { u, v }, [{ v, role: "compared" }]);
      seen[v] = true;
      queue.push(v);
      G.visited.push(v);
      G.frontier = [...queue];
      G.step({ type: "enqueue", element: ref(v) }, "enqueue", `Mark ${v} as seen and add it to the back of the queue: ${list(queue)}.`, { u, v, queueSize: queue.length }, [{ v, role: "created" }], [v]);
    }
    G.activeEdge = null;
  }
  G.current = null;
  G.step({ type: "init" }, "loop", "The queue is empty, so every reachable vertex has been visited.", { queueSize: 0 });
  G.step({ type: "done" }, "finish", `Breadth-first order from ${start}: ${list(G.output)}.`, { count: G.output.length });
  return G.finish([...G.output], "O(V²)", "O(V)");
}
export const bfsTraversal: AlgorithmDefinition<GraphInput> = { id: ID, parseInput, run };
