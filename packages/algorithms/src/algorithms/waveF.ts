import type { AlgorithmDefinition } from "../definition";
import { countFrequencies } from "./count-frequencies";
import { firstRepeatingElement } from "./first-repeating-element";
import { hashTableInsertLinearProbing } from "./hash-table-insert-linear-probing";
import { hashTableSearch } from "./hash-table-search";
import { twoSumHash } from "./two-sum-hash";

/** Wave F: Wave F: hashing.. */
export const waveF: readonly AlgorithmDefinition<never>[] = [
  hashTableInsertLinearProbing as AlgorithmDefinition<never>,
  hashTableSearch as AlgorithmDefinition<never>,
  twoSumHash as AlgorithmDefinition<never>,
  firstRepeatingElement as AlgorithmDefinition<never>,
  countFrequencies as AlgorithmDefinition<never>,
];
