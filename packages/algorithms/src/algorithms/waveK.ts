import type { AlgorithmDefinition } from "../definition";
import { generateParenthesesCount, nQueensCount, subsetSumCount } from "./interview-backtracking";
import { coinChangeWays, decodeWays, houseRobberCircular, maxProductSubarray, minCostClimbingStairs, subsetSumDp, uniquePaths } from "./interview-dp";

/** Wave K (milestone 9): backtracking and classic dynamic programming. */
export const waveK: readonly AlgorithmDefinition<never>[] = [
  subsetSumCount as AlgorithmDefinition<never>,
  nQueensCount as AlgorithmDefinition<never>,
  generateParenthesesCount as AlgorithmDefinition<never>,
  uniquePaths as AlgorithmDefinition<never>,
  coinChangeWays as AlgorithmDefinition<never>,
  subsetSumDp as AlgorithmDefinition<never>,
  houseRobberCircular as AlgorithmDefinition<never>,
  minCostClimbingStairs as AlgorithmDefinition<never>,
  maxProductSubarray as AlgorithmDefinition<never>,
  decodeWays as AlgorithmDefinition<never>,
];
