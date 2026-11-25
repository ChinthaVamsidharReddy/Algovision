import type { Story } from "./types";
import { palindromeFrame } from "./palindrome-core";

/** Every mirror in a row of letters has a centre. Try every centre and count each ring outwards. */
export const countPalindromicStory: Story = {
  id: "count-palindromic-substrings",
  title: "Mirrors Around Every Centre",
  emoji: "🪞",
  hook: "A row of letter tiles hides little mirrors: pieces that read the same forwards and backwards, like 'aba'. Every mirror has a centre, either one tile or the gap between two tiles. Standing at a centre, one kid steps left and one steps right, and every time the two tiles match, that is one more mirror. When they differ, or the row ends, this centre is finished. Try every centre and count them all.",
  cast: [
    { emoji: "👦", name: "Left kid", means: "left: steps outwards to the left" },
    { emoji: "👧", name: "Right kid", means: "right: steps outwards to the right" },
    { emoji: "🪞", name: "Mirror", means: "a palindromic piece, counted once per ring" },
  ],
  moral: "A string of n letters has 2n - 1 centres. Grow outwards from each one while the ends match, and count every success. No piece is counted twice, because each belongs to exactly one centre.",
  frame: (step) => palindromeFrame(step, "count"),
};
