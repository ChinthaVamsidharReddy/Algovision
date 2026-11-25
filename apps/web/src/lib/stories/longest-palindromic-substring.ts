import type { Story } from "./types";
import { palindromeFrame } from "./palindrome-core";

/** Every mirror in a row of letters has a centre. Try every centre and remember the widest ring. */
export const longestPalindromicStory: Story = {
  id: "longest-palindromic-substring",
  title: "The Biggest Mirror",
  emoji: "🔮",
  hook: "A row of letter tiles hides little mirrors: pieces that read the same forwards and backwards, like 'aba'. Every mirror has a centre, either one tile or the gap between two tiles. Standing at a centre, one kid steps left and one steps right while the two tiles match. When they differ, or the row ends, this centre is finished. Try every centre and remember the widest mirror you saw.",
  cast: [
    { emoji: "👦", name: "Left kid", means: "left: steps outwards to the left" },
    { emoji: "👧", name: "Right kid", means: "right: steps outwards to the right" },
    { emoji: "🔮", name: "Biggest mirror", means: "best: the widest ring so far" },
  ],
  moral: "The longest palindrome is the widest ring around some centre. Try all 2n - 1 centres and grow each outwards: simple, and O(n squared) in the worst case with no extra memory.",
  frame: (step) => palindromeFrame(step, "longest"),
};
