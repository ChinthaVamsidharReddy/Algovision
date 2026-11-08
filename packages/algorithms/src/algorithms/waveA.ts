import type { AlgorithmDefinition } from "../definition";
import { binarySearchFirstOccurrence } from "./binary-search-first-occurrence";
import { countingSort } from "./counting-sort";
import { heapSort } from "./heap-sort";
import { jumpSearch } from "./jump-search";
import { mergeSort } from "./merge-sort";
import { quickSort } from "./quick-sort";
import { shellSort } from "./shell-sort";

/** Wave A: sorting and searching. */
export const waveA: readonly AlgorithmDefinition<never>[] = [
  mergeSort as AlgorithmDefinition<never>,
  quickSort as AlgorithmDefinition<never>,
  heapSort as AlgorithmDefinition<never>,
  countingSort as AlgorithmDefinition<never>,
  shellSort as AlgorithmDefinition<never>,
  jumpSearch as AlgorithmDefinition<never>,
  binarySearchFirstOccurrence as AlgorithmDefinition<never>,
];
