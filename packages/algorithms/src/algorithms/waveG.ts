import type { AlgorithmDefinition } from "../definition";
import { climbingStairs } from "./climbing-stairs";
import { coinChangeMinCoins } from "./coin-change-min-coins";
import { fibonacciDp } from "./fibonacci-dp";
import { houseRobber } from "./house-robber";
import { knapsack01d } from "./knapsack-01-1d";
import { longestIncreasingSubsequence } from "./longest-increasing-subsequence";

/** Wave G: Wave G: dynamic programming.. */
export const waveG: readonly AlgorithmDefinition<never>[] = [
  fibonacciDp as AlgorithmDefinition<never>,
  climbingStairs as AlgorithmDefinition<never>,
  houseRobber as AlgorithmDefinition<never>,
  coinChangeMinCoins as AlgorithmDefinition<never>,
  longestIncreasingSubsequence as AlgorithmDefinition<never>,
  knapsack01d as AlgorithmDefinition<never>,
];
