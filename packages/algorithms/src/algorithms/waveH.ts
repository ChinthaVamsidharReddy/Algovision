import type { AlgorithmDefinition } from "../definition";
import { bfsShortestPath } from "./bfs-shortest-path";
import { bfsTraversal } from "./bfs-traversal";
import { connectedComponents } from "./connected-components";
import { detectCycleUndirected } from "./detect-cycle-undirected";
import { dfsTraversal } from "./dfs-traversal";
import { dijkstra } from "./dijkstra";
import { topologicalSortKahn } from "./topological-sort-kahn";
import { unionFindComponents } from "./union-find-components";

/** Wave H: graphs. */
export const waveH: readonly AlgorithmDefinition<never>[] = [
  bfsTraversal as AlgorithmDefinition<never>,
  dfsTraversal as AlgorithmDefinition<never>,
  bfsShortestPath as AlgorithmDefinition<never>,
  connectedComponents as AlgorithmDefinition<never>,
  detectCycleUndirected as AlgorithmDefinition<never>,
  topologicalSortKahn as AlgorithmDefinition<never>,
  dijkstra as AlgorithmDefinition<never>,
  unionFindComponents as AlgorithmDefinition<never>,
];
