import { bubbleSortStory } from "./bubble-sort";
import { insertionSortStory } from "./insertion-sort";
import { kadaneStory } from "./kadane-max-subarray";
import { linearSearchStory } from "./linear-search";
import { moveZeroesStory } from "./move-zeroes";
import { removeDuplicatesSortedStory } from "./remove-duplicates-sorted";
import { selectionSortStory } from "./selection-sort";
import { twoSumHashStory } from "./two-sum-hash";
import { binarySearchStory } from "./binary-search";
import { containerWithMostWaterStory } from "./container-with-most-water";
import { dutchNationalFlagStory } from "./dutch-national-flag";
import { findDuplicateFloydStory } from "./find-duplicate-floyd";
import { isPalindromeStringStory } from "./is-palindrome-string";
import { reverseInPlaceStory } from "./reverse-in-place";
import { twoSumSortedStory } from "./two-sum-sorted";
import { linkedListReverseStory } from "./linked-list-reverse";
import { linkedListFindMiddleStory } from "./linked-list-find-middle";
import { linkedListRemoveNthStory } from "./linked-list-remove-nth-from-end";
import { linkedListSearchStory } from "./linked-list-search";
import { linkedListInsertHeadStory } from "./linked-list-insert-head";
import { linkedListDeleteValueStory } from "./linked-list-delete-value";
import { binaryTreeInorderStory } from "./binary-tree-inorder";
import { binaryTreePreorderStory } from "./binary-tree-preorder";
import { binaryTreePostorderStory } from "./binary-tree-postorder";
import { bstSearchStory } from "./bst-search";
import { bstInsertStory } from "./bst-insert";
import { treeHeightStory } from "./tree-height";
import { bfsTraversalStory } from "./bfs-traversal";
import { dfsTraversalStory } from "./dfs-traversal";
import { bfsShortestPathStory } from "./bfs-shortest-path";
import { dijkstraStory } from "./dijkstra";
import { topologicalSortKahnStory } from "./topological-sort-kahn";
import { minPathSumStory } from "./min-path-sum";
import { lcsStory } from "./longest-common-subsequence";
import { editDistanceStory } from "./edit-distance";
import { numberOfIslandsStory } from "./number-of-islands";
import { maxAreaOfIslandStory } from "./max-area-of-island";
import { rottingOrangesStory } from "./rotting-oranges";
import { spiralOrderStory } from "./spiral-order";
import { stackPushPopStory } from "./stack-push-pop";
import { factorialStory } from "./factorial";
import { fibonacciRecursiveStory } from "./fibonacci-recursive";
import { powerFastExponentiationStory } from "./power-fast-exponentiation";
import { sumOfDigitsRecursiveStory } from "./sum-of-digits-recursive";
import { towerOfHanoiMovesStory } from "./tower-of-hanoi-moves";
import { queueEnqueueDequeueStory } from "./queue-enqueue-dequeue";
import { validParenthesesStory } from "./valid-parentheses";
import { evaluatePostfixStory } from "./evaluate-postfix";
import { nextGreaterElementStory } from "./next-greater-element";
import { stockSpanStory } from "./stock-span";
import { largestRectangleStory } from "./largest-rectangle-histogram";
import { slidingWindowMaximumStory } from "./sliding-window-maximum";
import { heapSortStory } from "./heap-sort";
import { minHeapBuildInsertStory } from "./min-heap-build-insert";
import { heapifyBottomUpStory } from "./heapify-bottom-up";
import { kthLargestStory } from "./kth-largest-element";
import { levelOrderStory } from "./level-order-traversal";
import { countLeavesStory } from "./count-leaves";
import { bstFindMinMaxStory } from "./bst-find-min-max";
import { avlInsertStory } from "./avl-tree-insert";
import { trieInsertSearchStory } from "./trie-insert-search";
import { trieDistinctSubstringsStory } from "./trie-distinct-substrings";
import { longestRepeatedStory } from "./longest-repeated-substring";
import { longestSubstringNoRepeatStory } from "./longest-substring-no-repeat";
import { longestRepeatingReplacementStory } from "./longest-repeating-replacement";
import { countPalindromicStory } from "./count-palindromic-substrings";
import { longestPalindromicStory } from "./longest-palindromic-substring";
import { firstUniqueCharacterStory } from "./first-unique-character";
import { stringCompressionStory } from "./string-compression-length";
import { unionFindStory } from "./union-find-components";
import { connectedComponentsStory } from "./connected-components";
import { detectCycleUndirectedStory } from "./detect-cycle-undirected";
import { kruskalStory } from "./kruskal-mst";
import { stronglyConnectedStory } from "./strongly-connected-components";
import { segmentTreeStory } from "./segment-tree-range-sum";
import { fenwickStory } from "./fenwick-tree-prefix-sum";
import { countFrequenciesStory } from "./count-frequencies";
import { firstRepeatingStory } from "./first-repeating-element";
import { hashInsertStory } from "./hash-table-insert-linear-probing";
import { hashSearchStory } from "./hash-table-search";
import { circularQueueStory } from "./circular-queue";
import { linkedListInsertTailStory } from "./linked-list-insert-tail";
import { linkedListInsertAtPositionStory } from "./linked-list-insert-at-position";
import { lruCacheStory } from "./lru-cache";
import { firstOccurrenceStory } from "./binary-search-first-occurrence";
import { lowerBoundStory, upperBoundStory } from "./bound-core";
import { jumpSearchStory } from "./jump-search";
import { findPeakStory } from "./find-peak-element";
import { searchRotatedStory } from "./search-rotated-array";
import { findMaximumStory } from "./find-maximum";
import { countingSortStory } from "./counting-sort";
import { mergeSortStory } from "./merge-sort";
import { quickSortStory } from "./quick-sort";
import { shellSortStory } from "./shell-sort";
import { insertAtIndexStory } from "./insert-at-index";
import { deleteAtIndexStory } from "./delete-at-index";
import { prefixSumStory } from "./prefix-sum";
import { missingNumberStory } from "./missing-number";
import type { ChainStory, GraphStory, GridStory, PileStory, Story, TreeStory, TrieStory } from "./types";

/** Stories by algorithm id. Add an entry here (plus its file and a test case) to tell another algorithm as a story. */
export const STORIES: readonly Story[] = [findDuplicateFloydStory, twoSumSortedStory, isPalindromeStringStory, binarySearchStory, dutchNationalFlagStory, containerWithMostWaterStory, reverseInPlaceStory, linearSearchStory, bubbleSortStory, selectionSortStory, insertionSortStory, moveZeroesStory, removeDuplicatesSortedStory, twoSumHashStory, kadaneStory, heapSortStory, longestSubstringNoRepeatStory, longestRepeatingReplacementStory, countPalindromicStory, longestPalindromicStory, firstUniqueCharacterStory, stringCompressionStory, fenwickStory, countFrequenciesStory, firstRepeatingStory, hashInsertStory, hashSearchStory, circularQueueStory, firstOccurrenceStory, lowerBoundStory, upperBoundStory, jumpSearchStory, findPeakStory, searchRotatedStory, findMaximumStory, countingSortStory, mergeSortStory, quickSortStory, shellSortStory, insertAtIndexStory, deleteAtIndexStory, prefixSumStory, missingNumberStory];
/** Stories told over a chain of nodes (linked lists). */
/** Stories told over a binary tree. */
export const TREE_STORIES: readonly TreeStory[] = [binaryTreeInorderStory, binaryTreePreorderStory, binaryTreePostorderStory, bstSearchStory, bstInsertStory, treeHeightStory, minHeapBuildInsertStory, heapifyBottomUpStory, kthLargestStory, levelOrderStory, countLeavesStory, bstFindMinMaxStory, avlInsertStory, segmentTreeStory];
/** Stories told over a graph. */
export const GRAPH_STORIES: readonly GraphStory[] = [bfsTraversalStory, dfsTraversalStory, bfsShortestPathStory, dijkstraStory, topologicalSortKahnStory, unionFindStory, connectedComponentsStory, detectCycleUndirectedStory, kruskalStory, stronglyConnectedStory];
/** Stories told over a grid. */
export const GRID_STORIES: readonly GridStory[] = [minPathSumStory, lcsStory, editDistanceStory, numberOfIslandsStory, maxAreaOfIslandStory, rottingOrangesStory, spiralOrderStory];
/** Stories told over a stack or a queue. */
export const PILE_STORIES: readonly PileStory[] = [stackPushPopStory, queueEnqueueDequeueStory, validParenthesesStory, evaluatePostfixStory, nextGreaterElementStory, stockSpanStory, largestRectangleStory, slidingWindowMaximumStory, factorialStory, fibonacciRecursiveStory, powerFastExponentiationStory, sumOfDigitsRecursiveStory, towerOfHanoiMovesStory];
/** Stories told over a trie. */
export const TRIE_STORIES: readonly TrieStory[] = [trieInsertSearchStory, trieDistinctSubstringsStory, longestRepeatedStory];
export const CHAIN_STORIES: readonly ChainStory[] = [linkedListReverseStory, linkedListFindMiddleStory, linkedListRemoveNthStory, linkedListSearchStory, linkedListInsertHeadStory, linkedListDeleteValueStory, linkedListInsertTailStory, linkedListInsertAtPositionStory, lruCacheStory];
const BY_ID = new Map<string, Story | ChainStory | TreeStory | GraphStory | GridStory | PileStory | TrieStory>([...STORIES, ...CHAIN_STORIES, ...TREE_STORIES, ...GRAPH_STORIES, ...GRID_STORIES, ...PILE_STORIES, ...TRIE_STORIES].map((s) => [s.id, s]));

export function storyFor(algorithmId: string): Story | ChainStory | TreeStory | GraphStory | GridStory | PileStory | TrieStory | undefined {
  return BY_ID.get(algorithmId);
}
export type { ChainStory, GraphStory, GridStory, PileStory, Story, StoryFrame, TreeStory, TrieStory } from "./types";

/** True when this story was written for the kind of trace that is on screen. */
export function storyFitsState(story: Story | ChainStory | TreeStory | GraphStory | GridStory | PileStory | TrieStory, stateKind: string): boolean {
  if (story.kind === "pile") return stateKind === "stack" || stateKind === "queue";
  return stateKind === (story.kind ?? "array");
}
