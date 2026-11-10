import type { AlgorithmDefinition } from "../definition";
import { findDuplicateFloyd, majorityElement, mergeIntervals, missingNumber, bestTimeToBuySell, trappingRainWater } from "./interview-arrays";
import { findPeakElement, lowerBound, nextPermutation, searchRotatedArray, upperBound } from "./interview-arrays-b";

/** Wave I (milestone 9): array patterns and binary-search variants. */
export const waveI: readonly AlgorithmDefinition<never>[] = [
  majorityElement as AlgorithmDefinition<never>,
  bestTimeToBuySell as AlgorithmDefinition<never>,
  trappingRainWater as AlgorithmDefinition<never>,
  mergeIntervals as AlgorithmDefinition<never>,
  missingNumber as AlgorithmDefinition<never>,
  findDuplicateFloyd as AlgorithmDefinition<never>,
  nextPermutation as AlgorithmDefinition<never>,
  lowerBound as AlgorithmDefinition<never>,
  upperBound as AlgorithmDefinition<never>,
  searchRotatedArray as AlgorithmDefinition<never>,
  findPeakElement as AlgorithmDefinition<never>,
];
