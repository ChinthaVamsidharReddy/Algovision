import type { AlgorithmDefinition } from "../definition";
import { containerWithMostWater } from "./container-with-most-water";
import { dutchNationalFlag } from "./dutch-national-flag";
import { kadaneMaxSubarray } from "./kadane-max-subarray";
import { longestOnesKFlips } from "./longest-ones-k-flips";
import { longestSubarraySumAtMost } from "./longest-subarray-sum-at-most";
import { moveZeroes } from "./move-zeroes";
import { rotateArray } from "./rotate-array";
import { threeSumCount } from "./three-sum-count";

/** Wave B: array techniques, two pointers, sliding window. */
export const waveB: readonly AlgorithmDefinition<never>[] = [
  kadaneMaxSubarray as AlgorithmDefinition<never>,
  rotateArray as AlgorithmDefinition<never>,
  moveZeroes as AlgorithmDefinition<never>,
  dutchNationalFlag as AlgorithmDefinition<never>,
  containerWithMostWater as AlgorithmDefinition<never>,
  threeSumCount as AlgorithmDefinition<never>,
  longestOnesKFlips as AlgorithmDefinition<never>,
  longestSubarraySumAtMost as AlgorithmDefinition<never>,
];
