import type { AlgorithmDefinition } from "../definition";
import { fenwickTreePrefixSum, kruskalMst, segmentTreeRangeSum, stronglyConnectedComponents } from "./interview-structures";

/** Wave O (milestone 13 part 2): Fenwick tree, segment tree, Kruskal MST, strongly connected components. */
export const waveO: readonly AlgorithmDefinition<never>[] = [
  fenwickTreePrefixSum as AlgorithmDefinition<never>,
  segmentTreeRangeSum as AlgorithmDefinition<never>,
  kruskalMst as AlgorithmDefinition<never>,
  stronglyConnectedComponents as AlgorithmDefinition<never>,
];
