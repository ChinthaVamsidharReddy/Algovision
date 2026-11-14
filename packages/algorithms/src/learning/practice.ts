export interface PracticeLink {
  readonly title: string;
  readonly url: string;
  readonly source: "LeetCode";
}

const lc = (title: string, slug: string): PracticeLink => ({ title, url: `https://leetcode.com/problems/${slug}/`, source: "LeetCode" });

/**
 * Practice problems that use the same idea. Only well-known problems are listed; an algorithm without an entry simply shows no
 * practice panel. Links are plain https URLs to the public problem pages and are not fetched at build time.
 */
export const PRACTICE: Readonly<Record<string, readonly PracticeLink[]>> = {
  "binary-search": [lc("Binary Search", "binary-search")],
  "lower-bound": [lc("Search Insert Position", "search-insert-position")],
  "binary-search-first-occurrence": [lc("Find First and Last Position of Element in Sorted Array", "find-first-and-last-position-of-element-in-sorted-array")],
  "search-rotated-array": [lc("Search in Rotated Sorted Array", "search-in-rotated-sorted-array")],
  "find-peak-element": [lc("Find Peak Element", "find-peak-element")],
  "kadane-max-subarray": [lc("Maximum Subarray", "maximum-subarray")],
  "best-time-to-buy-sell-stock": [lc("Best Time to Buy and Sell Stock", "best-time-to-buy-and-sell-stock")],
  "trapping-rain-water": [lc("Trapping Rain Water", "trapping-rain-water")],
  "merge-intervals": [lc("Merge Intervals", "merge-intervals")],
  "missing-number": [lc("Missing Number", "missing-number")],
  "find-duplicate-floyd": [lc("Find the Duplicate Number", "find-the-duplicate-number")],
  "next-permutation": [lc("Next Permutation", "next-permutation")],
  "majority-element-boyer-moore": [lc("Majority Element", "majority-element")],
  "rotate-array": [lc("Rotate Array", "rotate-array")],
  "two-sum-sorted": [lc("Two Sum II - Input Array Is Sorted", "two-sum-ii-input-array-is-sorted")],
  "is-palindrome-string": [lc("Valid Palindrome", "valid-palindrome")],
  "first-unique-character": [lc("First Unique Character in a String", "first-unique-character-in-a-string")],
  "longest-substring-no-repeat": [lc("Longest Substring Without Repeating Characters", "longest-substring-without-repeating-characters")],
  "longest-palindromic-substring": [lc("Longest Palindromic Substring", "longest-palindromic-substring")],
  "count-palindromic-substrings": [lc("Palindromic Substrings", "palindromic-substrings")],
  "longest-repeating-replacement": [lc("Longest Repeating Character Replacement", "longest-repeating-character-replacement")],
  "two-sum-hash": [lc("Two Sum", "two-sum")],
  "move-zeroes": [lc("Move Zeroes", "move-zeroes")],
  "remove-duplicates-sorted": [lc("Remove Duplicates from Sorted Array", "remove-duplicates-from-sorted-array")],
  "dutch-national-flag": [lc("Sort Colors", "sort-colors")],
  "container-with-most-water": [lc("Container With Most Water", "container-with-most-water")],
  "three-sum-count": [lc("3Sum", "3sum")],
  "max-sum-subarray-k": [lc("Maximum Average Subarray I", "maximum-average-subarray-i")],
  "smallest-subarray-sum": [lc("Minimum Size Subarray Sum", "minimum-size-subarray-sum")],
  "longest-ones-k-flips": [lc("Max Consecutive Ones III", "max-consecutive-ones-iii")],
  "valid-parentheses": [lc("Valid Parentheses", "valid-parentheses")],
  "evaluate-postfix": [lc("Evaluate Reverse Polish Notation", "evaluate-reverse-polish-notation")],
  "next-greater-element": [lc("Next Greater Element I", "next-greater-element-i")],
  "stock-span": [lc("Online Stock Span", "online-stock-span")],
  "largest-rectangle-histogram": [lc("Largest Rectangle in Histogram", "largest-rectangle-in-histogram")],
  "sliding-window-maximum": [lc("Sliding Window Maximum", "sliding-window-maximum")],
  "linked-list-reverse": [lc("Reverse Linked List", "reverse-linked-list")],
  "linked-list-find-middle": [lc("Middle of the Linked List", "middle-of-the-linked-list")],
  "linked-list-remove-nth-from-end": [lc("Remove Nth Node From End of List", "remove-nth-node-from-end-of-list")],
  "tree-height": [lc("Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree")],
  "binary-tree-inorder": [lc("Binary Tree Inorder Traversal", "binary-tree-inorder-traversal")],
  "binary-tree-preorder": [lc("Binary Tree Preorder Traversal", "binary-tree-preorder-traversal")],
  "binary-tree-postorder": [lc("Binary Tree Postorder Traversal", "binary-tree-postorder-traversal")],
  "level-order-traversal": [lc("Binary Tree Level Order Traversal", "binary-tree-level-order-traversal")],
  "bst-search": [lc("Search in a Binary Search Tree", "search-in-a-binary-search-tree")],
  "bst-insert": [lc("Insert into a Binary Search Tree", "insert-into-a-binary-search-tree")],
  "topological-sort-kahn": [lc("Course Schedule II", "course-schedule-ii")],
  "dijkstra": [lc("Network Delay Time", "network-delay-time")],
  "climbing-stairs": [lc("Climbing Stairs", "climbing-stairs")],
  "fibonacci-dp": [lc("Fibonacci Number", "fibonacci-number")],
  "house-robber": [lc("House Robber", "house-robber")],
  "house-robber-circular": [lc("House Robber II", "house-robber-ii")],
  "coin-change-min-coins": [lc("Coin Change", "coin-change")],
  "coin-change-ways": [lc("Coin Change II", "coin-change-ii")],
  "longest-increasing-subsequence": [lc("Longest Increasing Subsequence", "longest-increasing-subsequence")],
  "decode-ways": [lc("Decode Ways", "decode-ways")],
  "max-product-subarray": [lc("Maximum Product Subarray", "maximum-product-subarray")],
  "min-cost-climbing-stairs": [lc("Min Cost Climbing Stairs", "min-cost-climbing-stairs")],
  "unique-paths": [lc("Unique Paths", "unique-paths")],
  "subset-sum-dp": [lc("Partition Equal Subset Sum", "partition-equal-subset-sum")],
  "power-fast-exponentiation": [lc("Pow(x, n)", "powx-n")],
  "generate-parentheses-count": [lc("Generate Parentheses", "generate-parentheses")],
  "n-queens-count": [lc("N-Queens II", "n-queens-ii")],
  "jump-game": [lc("Jump Game", "jump-game")],
  "min-jumps-to-end": [lc("Jump Game II", "jump-game-ii")],
  "activity-selection": [lc("Non-overlapping Intervals", "non-overlapping-intervals")],
  "count-set-bits-kernighan": [lc("Number of 1 Bits", "number-of-1-bits")],
  "power-of-two-check": [lc("Power of Two", "power-of-two")],
  "single-number-xor": [lc("Single Number", "single-number")],
  "sieve-of-eratosthenes": [lc("Count Primes", "count-primes")],
};

export function practiceFor(algorithmId: string): readonly PracticeLink[] {
  return PRACTICE[algorithmId] ?? [];
}
