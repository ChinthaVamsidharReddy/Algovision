import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { adjacency, describeEdges, edgesOf, GraphTrace, list, parseGraph, ref, type GraphInput } from "./graph-common";

export const ID = "dfs-traversal";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<GraphInput> {
  return parseGraph(raw, limits, { stride: 2, start: true, directed: false });
}

export function run(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices, start } = input;
  const edges = edgesOf(values, 2);
  const adj = adjacency(vertices, edges, false);
  const G = new GraphTrace({ id: ID, input: { values: [...values], vertices, start }, vertices, edges, directed: false, weighted: false, frontierName: "Call stack", markName: "", limits });
  G.step({ type: "init" }, "entry", `Visit every vertex reachable from ${start} in depth-first order: follow one path as deep as it goes, then back up and try the next neighbor.`, { start });
  G.step({ type: "init" }, "build-graph", `Store the edges (${describeEdges(edges, false, false)}) in an adjacency matrix. The graph has ${vertices} vertices numbered 0 to ${vertices - 1}.`, { vertices, edges: edges.length });
  G.step({ type: "init" }, "init-visited", "Create a seen flag for every vertex and an empty visit order.", { depth: 0 });
  const seen = new Array<boolean>(vertices).fill(false);
  const stack: number[] = [];
  const visit = (u: number, from: string): void => {
    stack.push(u);
    G.current = u;
    G.frontier = [...stack];
    G.step({ type: "call", node: `g${u}` }, "call", `${from ? from + " " : ""}The call visit(${u}) starts. The call stack is now ${list(stack)}.`, { u, depth: stack.length });
    seen[u] = true;
    G.visited.push(u);
    G.output.push(u);
    G.step({ type: "visit", element: ref(u) }, "visit", `Mark ${u} as seen and add it to the visit order: ${list(G.output)}.`, { u, depth: stack.length }, [], [u]);
    const neighbors = adj[u]!.flatMap((w, v) => (w > 0 ? [v] : []));
    G.step({ type: "init" }, "neighbors-loop", neighbors.length === 0 ? `${u} has no neighbors.` : `Look at each neighbor of ${u} in increasing order: ${list(neighbors)}.`, { u, depth: stack.length });
    for (const v of neighbors) {
      G.activeEdge = { from: u, to: v };
      G.current = u;
      if (seen[v]) {
        G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} was already seen, so skip it.`, { u, v, depth: stack.length }, [{ v, role: "compared" }]);
        continue;
      }
      G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} has not been seen, so go deeper into it.`, { u, v, depth: stack.length }, [{ v, role: "compared" }]);
      G.step({ type: "init" }, "recurse", `Call visit(${v}) from ${u}. The search leaves ${u} for now and comes back when ${v} is completely explored.`, { u, v, depth: stack.length });
      visit(v, `Going from ${u} to ${v}.`);
      G.current = u;
    }
    G.activeEdge = null;
    stack.pop();
    G.frontier = [...stack];
    G.current = stack.length > 0 ? stack[stack.length - 1]! : null;
    G.step({ type: "return", node: `g${u}` }, "neighbors-loop", `Every neighbor of ${u} is handled, so visit(${u}) returns${stack.length > 0 ? ` to ${stack[stack.length - 1]}` : ""}.`, { u, depth: stack.length });
  };
  G.step({ type: "init" }, "start-call", `Call visit(${start}) to begin the search.`, { start });
  visit(start, "");
  G.current = null;
  G.step({ type: "done" }, "finish", `Depth-first order from ${start}: ${list(G.output)}.`, { count: G.output.length });
  return G.finish([...G.output], "O(V²)", "O(V)");
}
export const dfsTraversal: AlgorithmDefinition<GraphInput> = { id: ID, parseInput, run };
