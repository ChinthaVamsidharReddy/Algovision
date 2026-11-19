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
import type { ChainStory, Story } from "./types";

/** Stories by algorithm id. Add an entry here (plus its file and a test case) to tell another algorithm as a story. */
export const STORIES: readonly Story[] = [findDuplicateFloydStory, twoSumSortedStory, isPalindromeStringStory, binarySearchStory, dutchNationalFlagStory, containerWithMostWaterStory, reverseInPlaceStory, linearSearchStory, bubbleSortStory, selectionSortStory, insertionSortStory, moveZeroesStory, removeDuplicatesSortedStory, twoSumHashStory, kadaneStory];
/** Stories told over a chain of nodes (linked lists). */
export const CHAIN_STORIES: readonly ChainStory[] = [linkedListReverseStory, linkedListFindMiddleStory, linkedListRemoveNthStory, linkedListSearchStory, linkedListInsertHeadStory, linkedListDeleteValueStory];
const BY_ID = new Map<string, Story | ChainStory>([...STORIES, ...CHAIN_STORIES].map((s) => [s.id, s]));

export function storyFor(algorithmId: string): Story | ChainStory | undefined {
  return BY_ID.get(algorithmId);
}
export type { ChainStory, Story, StoryFrame } from "./types";
