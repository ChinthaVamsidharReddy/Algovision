import type { AlgorithmDefinition } from "../definition";
import { longestRepeatedSubstring, trieDistinctSubstrings } from "./interview-trie";

/** Wave P (milestone 14): suffix-trie algorithms on the new trie state. */
export const waveP: readonly AlgorithmDefinition<never>[] = [
  trieDistinctSubstrings as AlgorithmDefinition<never>,
  longestRepeatedSubstring as AlgorithmDefinition<never>,
];
