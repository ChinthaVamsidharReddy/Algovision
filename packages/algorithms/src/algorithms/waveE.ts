import type { AlgorithmDefinition } from "../definition";
import { binaryTreePostorder } from "./binary-tree-postorder";
import { binaryTreePreorder } from "./binary-tree-preorder";
import { bstFindMinMax } from "./bst-find-min-max";
import { bstInsert } from "./bst-insert";
import { bstSearch } from "./bst-search";
import { countLeaves } from "./count-leaves";
import { levelOrderTraversal } from "./level-order-traversal";
import { treeHeight } from "./tree-height";

/** Wave E: Wave E: binary trees and binary search trees.. */
export const waveE: readonly AlgorithmDefinition<never>[] = [
  binaryTreePreorder as AlgorithmDefinition<never>,
  binaryTreePostorder as AlgorithmDefinition<never>,
  levelOrderTraversal as AlgorithmDefinition<never>,
  bstSearch as AlgorithmDefinition<never>,
  bstInsert as AlgorithmDefinition<never>,
  treeHeight as AlgorithmDefinition<never>,
  countLeaves as AlgorithmDefinition<never>,
  bstFindMinMax as AlgorithmDefinition<never>,
];
