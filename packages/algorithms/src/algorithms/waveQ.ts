import type { AlgorithmDefinition } from "../definition";
import { lruCache, trieInsertSearch } from "./interview-ops";

/** Wave Q (milestone 15): algorithms driven by an operation list (input kind `ops`). */
export const waveQ: readonly AlgorithmDefinition<never>[] = [
  lruCache as AlgorithmDefinition<never>,
  trieInsertSearch as AlgorithmDefinition<never>,
];
