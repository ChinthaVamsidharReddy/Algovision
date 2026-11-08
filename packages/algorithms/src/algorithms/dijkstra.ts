import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { adjacency, describeEdges, edgesOf, GraphTrace, list, parseGraph, ref, type GraphInput } from "./graph-common";

export const ID = "dijkstra";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<GraphInput> {
  return parseGraph(raw, limits, { stride: 3, start: true, directed: false });
}

/** O(V²) Dijkstra on an undirected weighted graph. Distances of unreachable vertices are reported as -1. */
export function run(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices, start } = input;
  const edges = edgesOf(values, 3);
  const adj = adjacency(vertices, edges, false);
  const G = new GraphTrace({ id: ID, input: { values: [...values], vertices, start }, vertices, edges, directed: false, weighted: true, frontierName: "Candidates", markName: "Distance", limits });
  G.step({ type: "init" }, "entry", `Find the cheapest total weight from ${start} to every other vertex. Each round settles the closest unsettled vertex and checks whether going through it shortens any route.`, { start });
  G.step({ type: "init" }, "build-graph", `Store the weighted edges (${describeEdges(edges, false, true)}) in a matrix. The graph has ${vertices} vertices numbered 0 to ${vertices - 1}.`, { vertices, edges: edges.length });
  const done = new Array<boolean>(vertices).fill(false);
  G.marks[start] = 0;
  const candidates = () => G.marks.flatMap((d, v) => (d !== null && !done[v] ? [v] : []));
  G.frontier = candidates();
  G.step({ type: "assign", target: ref(start), value: 0 }, "init-dist", `Every distance starts unknown (shown as –, meaning infinity), except ${start} itself, which is 0.`, { start, dist: 0 }, [], [start]);
  for (let round = 0; round < vertices; round++) {
    G.step({ type: "init" }, "loop", `Round ${round + 1} of ${vertices}: pick the closest vertex that is not settled yet.`, { round: round + 1 });
    let u = -1;
    for (let i = 0; i < vertices; i++) if (!done[i] && G.marks[i] !== null && (u === -1 || G.marks[i]! < G.marks[u]!)) u = i;
    if (u === -1) {
      G.current = null;
      G.step({ type: "notFound" }, "unreachable-stop", "Every unsettled vertex still has distance infinity, so none of them can be reached. Stop.", { round: round + 1 });
      break;
    }
    G.current = u;
    G.step({ type: "found", element: ref(u) }, "select-min", `${u} has the smallest distance among candidates (${G.frontier.map((v) => `${v}: ${G.marks[v]}`).join(", ")}).`, { u, dist: G.marks[u]! }, [{ v: u, role: "found" }]);
    done[u] = true;
    G.visited.push(u);
    G.frontier = candidates();
    G.step({ type: "visit", element: ref(u) }, "settle", `Settle ${u}: its distance ${G.marks[u]} is final, because every other route would have to start with an edge that costs at least as much.`, { u, dist: G.marks[u]! }, [], [u]);
    const neighbors = adj[u]!.flatMap((w, v) => (w > 0 ? [v] : []));
    G.step({ type: "init" }, "neighbors-loop", neighbors.length === 0 ? `${u} has no neighbors.` : `Look at each neighbor of ${u} in increasing order: ${list(neighbors)}.`, { u, dist: G.marks[u]! });
    for (const v of neighbors) {
      G.activeEdge = { from: u, to: v };
      const w = adj[u]![v]!;
      if (done[v]) {
        G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `${v} is already settled, so its distance cannot improve.`, { u, v, weight: w }, [{ v, role: "compared" }]);
        continue;
      }
      const through = G.marks[u]! + w;
      const better = G.marks[v] === null || through < G.marks[v]!;
      const known = G.marks[v] === null ? `${v} has no distance yet` : `${v} currently has distance ${G.marks[v]}`;
      G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Going to ${v} through ${u} costs ${G.marks[u]} + ${w} = ${through}; ${known}.`, { u, v, weight: w, through }, [{ v, role: "compared" }]);
      if (better) {
        G.marks[v] = through;
        G.frontier = candidates();
        G.step({ type: "assign", target: ref(v), value: through }, "relax", `Shorter route found: set the distance of ${v} to ${through}.`, { u, v, weight: w, dist: through }, [{ v, role: "created" }], [v]);
      }
    }
    G.activeEdge = null;
    G.current = null;
  }
  G.current = null;
  G.activeEdge = null;
  const result = G.marks.map((m) => (m === null ? -1 : m));
  G.output = [...result];
  G.step({ type: "done" }, "finish", `Cheapest distances from ${start}: ${list(result)} (−1 means unreachable).`, { reachable: result.filter((d) => d >= 0).length });
  return G.finish(result, "O(V²)", "O(V)");
}
export const dijkstra: AlgorithmDefinition<GraphInput> = { id: ID, parseInput, run };
