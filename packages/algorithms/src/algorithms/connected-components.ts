import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { adjacency, describeEdges, edgesOf, GraphTrace, list, parseGraph, ref, type GraphInput } from "./graph-common";

export const ID = "connected-components";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<GraphInput> {
  return parseGraph(raw, limits, { stride: 2, start: false, directed: false });
}

export function run(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices } = input;
  const edges = edgesOf(values, 2);
  const adj = adjacency(vertices, edges, false);
  const G = new GraphTrace({ id: ID, input: { values: [...values], vertices }, vertices, edges, directed: false, weighted: false, frontierName: "Stack", markName: "Component", limits });
  G.step({ type: "init" }, "entry", "Count the connected components: groups of vertices that can reach each other. Start a flood fill from every vertex that has no group yet.", { vertices });
  G.step({ type: "init" }, "build-graph", `Store the edges (${describeEdges(edges, false, false)}) in an adjacency matrix. The graph has ${vertices} vertices numbered 0 to ${vertices - 1}.`, { vertices, edges: edges.length });
  G.step({ type: "init" }, "init-labels", "Every vertex starts with no component label (shown as –).", { count: 0 });
  const stack: number[] = [];
  let count = 0;
  for (let s = 0; s < vertices; s++) {
    G.current = s;
    if (G.marks[s] !== null) {
      G.step({ type: "init" }, "outer-loop", `Vertex ${s} already belongs to component ${G.marks[s]}, so it does not start a new one.`, { s, count });
      continue;
    }
    G.step({ type: "init" }, "outer-loop", `Vertex ${s} has no component yet, so it starts a new one.`, { s, count });
    G.marks[s] = count;
    G.visited.push(s);
    stack.push(s);
    G.frontier = [...stack];
    G.step({ type: "push", element: ref(s) }, "new-component", `Label ${s} as component ${count} and push it on the stack to explore from it.`, { s, count, stackSize: stack.length }, [], [s]);
    while (stack.length > 0) {
      const u = stack.pop()!;
      G.frontier = [...stack];
      G.current = u;
      G.step({ type: "pop", element: ref(u) }, "pop", `Pop ${u} from the stack and look at its neighbors.`, { u, count, stackSize: stack.length });
      const neighbors = adj[u]!.flatMap((w, v) => (w > 0 ? [v] : []));
      G.step({ type: "init" }, "neighbors-loop", neighbors.length === 0 ? `${u} has no neighbors.` : `Look at each neighbor of ${u} in increasing order: ${list(neighbors)}.`, { u, count });
      for (const v of neighbors) {
        G.activeEdge = { from: u, to: v };
        if (G.marks[v] !== null) {
          G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} is already in component ${G.marks[v]}.`, { u, v, count }, [{ v, role: "compared" }]);
          continue;
        }
        G.step({ type: "compare", a: ref(u), b: ref(v) }, "check-neighbor", `Neighbor ${v} has no component yet, so it belongs to the same component as ${u}.`, { u, v, count }, [{ v, role: "compared" }]);
        G.marks[v] = count;
        G.visited.push(v);
        stack.push(v);
        G.frontier = [...stack];
        G.step({ type: "push", element: ref(v) }, "label", `Label ${v} as component ${count} and push it on the stack.`, { u, v, count, stackSize: stack.length }, [{ v, role: "created" }], [v]);
      }
      G.activeEdge = null;
    }
    count++;
    G.current = null;
    G.step({ type: "init" }, "next-component", `The stack is empty: nothing else is connected to ${s}. That finishes component ${count - 1}; ${count} found so far.`, { s, count });
  }
  G.current = null;
  G.output = [count];
  G.step({ type: "done" }, "finish", `Every vertex has a label. The graph has ${count} connected component${count === 1 ? "" : "s"}.`, { count, result: count });
  return G.finish(count, "O(V²)", "O(V)");
}
export const connectedComponents: AlgorithmDefinition<GraphInput> = { id: ID, parseInput, run };
