import type { AlgorithmDefinition } from "../definition";
import { countPalindromicSubstrings, firstUniqueCharacter, isPalindromeString, longestPalindromicSubstring, longestRepeatingReplacement, longestSubstringNoRepeat, stringCompressionLength } from "./interview-strings";

/** Wave L (milestone 11): string algorithms on the new `text` input kind. */
export const waveL: readonly AlgorithmDefinition<never>[] = [
  isPalindromeString as AlgorithmDefinition<never>,
  firstUniqueCharacter as AlgorithmDefinition<never>,
  longestSubstringNoRepeat as AlgorithmDefinition<never>,
  longestPalindromicSubstring as AlgorithmDefinition<never>,
  countPalindromicSubstrings as AlgorithmDefinition<never>,
  stringCompressionLength as AlgorithmDefinition<never>,
  longestRepeatingReplacement as AlgorithmDefinition<never>,
];
