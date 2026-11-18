import { binarySearchStory } from "./binary-search";
import { containerWithMostWaterStory } from "./container-with-most-water";
import { dutchNationalFlagStory } from "./dutch-national-flag";
import { findDuplicateFloydStory } from "./find-duplicate-floyd";
import { isPalindromeStringStory } from "./is-palindrome-string";
import { reverseInPlaceStory } from "./reverse-in-place";
import { twoSumSortedStory } from "./two-sum-sorted";
import type { Story } from "./types";

/** Stories by algorithm id. Add an entry here (plus its file and a test case) to tell another algorithm as a story. */
export const STORIES: readonly Story[] = [findDuplicateFloydStory, twoSumSortedStory, isPalindromeStringStory, binarySearchStory, dutchNationalFlagStory, containerWithMostWaterStory, reverseInPlaceStory];
const BY_ID = new Map(STORIES.map((s) => [s.id, s]));

export function storyFor(algorithmId: string): Story | undefined {
  return BY_ID.get(algorithmId);
}
export type { Story, StoryFrame } from "./types";
