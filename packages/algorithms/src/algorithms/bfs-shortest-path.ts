import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { adjacency, describeEdges, edgesOf, GraphTrace, list, parseGraph, ref, type GraphInput } from "./graph-common";

export const ID = "bfs-shortest-path";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<GraphInput> {
  return parseGraph(raw, limits, { stride: 2, start: true, directed: false });
}

export function run(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices, start } = input;
  const edges = edgesOf(values, 2);
  const adj = adjacency(vertices, edges, false);
  const G = new GraphTrace({ id: ID, input: { values: [...values], vertices, start }, vertices, edges, directed: false, weighted: false, frontierName: "Queue", markName: "Distance", limits });
  G.step({ type: "init" }, "entry", `Find the fewest edges needed to get from ${start} to every other vertex. Breadth-first search reaches vertices level by level, so the first time it reaches one is by a shortest route.`, { start });
  G.step({ type: "init" }, "build-graph", `Store the edges (${describeEdges(edges, false, false)}) in an adjacency matrix. The graph has ${vertices} vertices numbered 0 to ${vertices - 1}.`, { vertices, edges: edges.length });
  G.step({ type: "init" }, "init-dist", "Every distance starts as unknown (shown as –): no vertex has been reached yet.", { queueSize: 0 });
  const queue: number[] = [];
  G.marks[start] = 0;
  queue.push(start);
  G.visited.push(start);
  G.frontier = [...queue];
  G.step({ type: "enqueue", element: ref(start) }, "enqueue-start", `${start} is zero edges from itself: set its distance to 0 and put it in the queue.`, { start, queueSize: queue.length }, [], [start]);
  while (queue.length > 0) {
    G.step({ type: "init" }, "loop", `The queue is not empty (${list(queue)}), so there is a vertex to process.`, { queueSize: queue.length });
    const u = queue.shift()!;
    G.frontier = [...queue];
    G.current = u;
    G.step({ type: "dequeue", element: ref(u) }, "dequeue", `Take ${u} from the front of the queue. Its distance is ${G.marks[u]}.`, { u, dist: G.marks[u]!, queueSize: queue.length });
    const neighbors = adj[u]!.flatMap((w, v) => (w > 0 ? [v] : []));
    G.step({ type: "init" }, "neighbors-loop", neighbors.length === 0 ? `${u} has no neighbors.` : `Look at each neighbor of ${u} in increasing order: ${list(neighbors)}.`, { u, dist: G.marks[u]! });
    for (const v of neighbors) {
      G.activeEdge = { from: u, to: v };
      if (G.marks[v] !== null) {
        G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} already has distance ${G.marks[v]}, found by a route that is at least as short, so keep it.`, { u, v, dist: G.marks[u]! }, [{ v, role: "compared" }]);
        continue;
      }
      G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} has no distance yet, so this is the first and therefore shortest route to it.`, { u, v, dist: G.marks[u]! }, [{ v, role: "compared" }]);
      G.marks[v] = G.marks[u]! + 1;
      queue.push(v);
      G.visited.push(v);
      G.frontier = [...queue];
      G.step({ type: "enqueue", element: ref(v) }, "relax", `Set the distance of ${v} to ${G.marks[u]} + 1 = ${G.marks[v]} and add it to the queue: ${list(queue)}.`, { u, v, dist: G.marks[v]!, queueSize: queue.length }, [{ v, role: "created" }], [v]);
    }
    G.activeEdge = null;
  }
  G.current = null;
  G.step({ type: "init" }, "loop", "The queue is empty, so every reachable vertex has its shortest distance.", { queueSize: 0 });
  const result = G.marks.map((m) => (m === null ? -1 : m));
  G.output = [...result];
  G.step({ type: "done" }, "finish", `Distances from ${start}: ${list(result)} (−1 means unreachable).`, { reachable: result.filter((d) => d >= 0).length });
  return G.finish(result, "O(V²)", "O(V)");
}
export const bfsShortestPath: AlgorithmDefinition<GraphInput> = { id: ID, parseInput, run };
