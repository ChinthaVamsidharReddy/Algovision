# AlgoVision roadmap: from 109 algorithms to a complete beginner-to-product-company path

Today: 109 algorithms in 16 categories, four languages each, trace-driven visuals, accounts, progress, bookmarks, search.
Goal: a student can go from "what is an array" to "ready for product-company interviews" on one site.

Input kinds today are only `intList` and `int`. Strings and grids need new kinds (decision D1 below).

## 1. Missing algorithms, by topic (about 130 more)

Priority A = asked most in product-company interviews. B = common. C = advanced or nice to have.

| Topic | Missing | Pri |
| --- | --- | --- |
| Arrays | Majority element (Boyer-Moore), best time to buy and sell stock, product of array except self, trapping rain water, merge intervals, find duplicate (Floyd), missing number, next permutation, maximum product subarray, subarray sum equals K (prefix + hash), longest consecutive sequence, 4-sum | A |
| Binary search | Lower and upper bound, search in rotated array, find peak element, integer square root, search insert position, binary search on the answer (Koko eating bananas, ship packages), median of two sorted arrays | A |
| Sorting | Quickselect (kth largest), count inversions, radix sort, bucket sort, cocktail sort, sorting-race comparison | B |
| Linked lists | Floyd cycle detection, find cycle start, merge two sorted lists, palindrome list, intersection of two lists, remove duplicates, reorder list, add two numbers, doubly linked list, LRU cache | A |
| Stacks and queues | Min stack, monotonic stack (daily temperatures, largest rectangle in histogram), queue using two stacks, stack using queues, deque, stock span, decode string | A |
| Heaps and priority queues (new category) | Heap insert and extract, build heap, top-K elements, merge K sorted lists, median of a data stream, K closest points | A |
| Trees | BST delete, validate BST, lowest common ancestor, diameter, balanced check, invert, symmetric, path sum, right-side view, zigzag, kth smallest in BST, build from preorder and inorder, AVL rotations | A |
| Tries and advanced trees (new) | Trie insert and search, autocomplete, segment tree, Fenwick tree | B |
| Graphs | Number of islands, Bellman-Ford, Floyd-Warshall, Prim, Kruskal, bipartite check, cycle detection in directed graphs, course schedule, word ladder, clone graph, Kosaraju or Tarjan SCC, bridges, A* | A/B |
| Dynamic programming | Edit distance, longest common subsequence, longest palindromic substring, subset sum, partition equal subset, unbounded knapsack, rod cutting, unique paths, minimum path sum, coin change (ways), word break, decode ways, jump game, stock with cooldown, matrix chain, egg drop | A |
| Backtracking (new) | Subsets, permutations, combination sum, N-Queens, generate parentheses, word search, Sudoku, rat in a maze, palindrome partitioning | A |
| Greedy (new) | Activity selection, fractional knapsack, jump game, gas station, Huffman coding, minimum platforms, job sequencing, interval scheduling | A |
| Strings (new) | Valid palindrome, valid anagram, longest substring without repeating, longest common prefix, KMP, Rabin-Karp, Z-algorithm, group anagrams, minimum window substring, Manacher | A |
| Bit manipulation (new) | Count set bits, power of two, single number (XOR), reverse bits, subsets by bitmask, missing number by XOR | B |
| Math and number theory (new) | GCD (Euclid), sieve of Eratosthenes, prime check, Pascal's triangle, fast modular exponentiation, reservoir sampling | B |
| Hashing | Chaining and double hashing, LRU cache, rolling hash, Bloom filter, consistent hashing (bridge to system design) | B |
| Recursion | GCD, palindrome check, permutations of a string, flood fill, Josephus | B |

Note: heap sort is already included (I listed it as missing earlier by mistake).

## 2. Features that would make it the best learning site

Learning
- **Learning paths:** Beginner, Intermediate, Pro; company tracks (Amazon, Google, Microsoft, Flipkart and similar); 30, 60 and 90 day plans; "where do I start?" quiz.
- **Prerequisites and a pattern index:** "Learn this first", and "how to recognise a sliding-window problem".
- **Quizzes:** a short multiple-choice check per algorithm, plus "predict the next step" mode.
- **Practice links:** each algorithm mapped to LeetCode, GeeksforGeeks and similar problems, with difficulty.
- **Interview notes per algorithm:** common questions, edge cases, mistakes, and a one-page complexity cheat sheet.
- **Compare mode:** sorting race and side-by-side traces; Big-O growth chart.
- **Revision:** spaced repetition, personal notes, streaks, XP, badges, certificates.

Interactivity
- **New input kinds:** string, grid or matrix, and a tree/graph builder (type or drag).
- **Edit and run your own code** (MVP 2), with more languages (JavaScript, Go, Kotlin).
- **AI tutor:** "explain this step", "why did it do that?", "give me a hint" (the biggest differentiator).
- **Mock interview mode:** timed problem, hints, and a score.
- **Shareable trace links and embeds.**

Platform
- Installable app and offline use (PWA); Telugu and Hindi interface; admin tool to add algorithms without code.
- Teacher role (classes, assignments, progress reports): the Instructor role is built but switched off.
- Feedback button, privacy-friendly analytics, uptime monitoring, load test, backups.

## 3. Milestones

| # | Milestone | Contents | Adds |
| --- | --- | --- | --- |
| 9 | Interview core I | Priority-A items that need no new input kind: array patterns, binary-search variants, linked-list (Floyd, merge), monotonic stack, DP (1D and classic), subsets, permutations, N-Queens, greedy, bit tricks, GCD and sieve. New categories: Backtracking, Greedy, Bit Manipulation, Math. | about 45 planned; 32 delivered (see section 3a) |
| 10 | Learning experience | Learning paths, prerequisites, quizzes, practice links, cheat sheets, compare mode | features |
| 11 | New input kinds | String and grid kinds, then Strings, grid graphs (islands, rotting oranges), edit distance, LCS, KMP | about 30 |
| 12 | Heaps, tries and advanced trees | Heap visual, top-K, trie, segment tree, Fenwick, AVL, MST, SCC, LRU | about 25 |
| 13 | Engagement | Streaks, XP, badges, spaced repetition, notes, certificates | features |
| 14 | AI tutor and run-your-own-code | Tutor, mock interview, code sandbox, more languages | features |
| 15 | Hardening and reach | PWA, i18n, admin tool, analytics, teacher role, load test | features |

Result: about 180 algorithms and a full path from first lesson to interview.

### 3a. Milestone 9 delivery notes

Delivered 32 algorithms in three batches: array and binary-search patterns (11), monotonic stacks, math, bit tricks and greedy (11), backtracking and classic dynamic programming (10). Four categories were added (Backtracking, Greedy, Math, Bit Manipulation).

Deferred from the original M9 list because they need an input the current `intList` / `int` kinds cannot express: linked-list cycle detection (needs a cycle position in the list state), merging two sorted lists (two lists), edit distance and longest common subsequence (strings), permutations and subsets that print every result (list-of-lists output). They move to the milestones that introduce string inputs and multi-list inputs.

## 4. Decisions needed before building (not changed silently)
- **D1:** add `string` and `grid` input kinds to the trace schema (a minor version, backward compatible)? Needed for Milestone 11.
- **D2:** AI tutor provider and cost model (needs an API key and a usage limit per student).
- **D3:** code sandbox approach (a hosted runner service or in-browser interpreters). Free-tier friendly options are limited.
- **D4:** whether to turn the Instructor role on (adds teacher screens and permissions).
