import type { AlgorithmDefinition } from "../definition";
import { editDistance, longestCommonSubsequence, maxAreaOfIsland, minPathSum, numberOfIslands, rottingOranges, spiralOrder } from "./interview-grid";

/** Wave M (milestone 11 part 2): grid and two-string table algorithms on the grid state. */
export const waveM: readonly AlgorithmDefinition<never>[] = [
  numberOfIslands as AlgorithmDefinition<never>,
  maxAreaOfIsland as AlgorithmDefinition<never>,
  rottingOranges as AlgorithmDefinition<never>,
  minPathSum as AlgorithmDefinition<never>,
  spiralOrder as AlgorithmDefinition<never>,
  longestCommonSubsequence as AlgorithmDefinition<never>,
  editDistance as AlgorithmDefinition<never>,
];
