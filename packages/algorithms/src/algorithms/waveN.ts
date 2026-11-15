import type { AlgorithmDefinition } from "../definition";
import { avlTreeInsert, heapifyBottomUp, kthLargestElement, minHeapBuildInsert } from "./interview-heaps";

/** Wave N (milestone 13 part 1): heaps drawn as trees, and an AVL tree. */
export const waveN: readonly AlgorithmDefinition<never>[] = [
  minHeapBuildInsert as AlgorithmDefinition<never>,
  heapifyBottomUp as AlgorithmDefinition<never>,
  kthLargestElement as AlgorithmDefinition<never>,
  avlTreeInsert as AlgorithmDefinition<never>,
];
