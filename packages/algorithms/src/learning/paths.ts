export type PathLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface LearningPath {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly level: PathLevel;
  readonly outcomes: readonly string[];
  /** Algorithm ids in the order they should be learned. */
  readonly steps: readonly string[];
}

/** Hand-ordered learning paths. Tests assert every id exists, no id repeats in a path, and every algorithm is on at least one path. */
export const PATHS: readonly LearningPath[] = [
  {
    id: "foundations", title: "Foundations", level: "BEGINNER",
    summary: "Your first hour: arrays, stacks, queues, recursion and a little maths. Every later path assumes these ideas.",
    outcomes: ["Read an array trace step by step", "Explain push, pop, enqueue and dequeue", "Trace a simple recursive call", "Count and search with loops"],
    steps: ["find-maximum", "linear-search", "prefix-sum", "insert-at-index", "delete-at-index", "stack-push-pop", "queue-enqueue-dequeue", "factorial", "sum-of-digits-recursive", "gcd-euclid", "count-frequencies"],
  },
  {
    id: "sorting-and-searching", title: "Sorting and searching", level: "BEGINNER",
    summary: "From the slow sorts you can trace by hand to the O(n log n) sorts, then binary search and its interview variants.",
    outcomes: ["Compare quadratic and O(n log n) sorts", "Write binary search without off-by-one bugs", "Use lower and upper bound", "Search a rotated array"],
    steps: ["bubble-sort", "selection-sort", "insertion-sort", "shell-sort", "merge-sort", "quick-sort", "heap-sort", "counting-sort", "binary-search", "binary-search-first-occurrence", "lower-bound", "upper-bound", "jump-search", "search-rotated-array", "find-peak-element"],
  },
  {
    id: "arrays-and-windows", title: "Arrays, two pointers and sliding windows", level: "INTERMEDIATE",
    summary: "The array patterns that open most interviews: prefix sums, two pointers, windows, Kadane and friends.",
    outcomes: ["Choose between two pointers and a window", "Solve maximum-subarray style problems in one pass", "Handle in-place array rewrites safely"],
    steps: ["two-sum-sorted", "reverse-in-place", "move-zeroes", "remove-duplicates-sorted", "dutch-national-flag", "container-with-most-water", "three-sum-count", "trapping-rain-water", "max-sum-subarray-k", "smallest-subarray-sum", "longest-subarray-sum-at-most", "longest-ones-k-flips", "kadane-max-subarray", "best-time-to-buy-sell-stock", "majority-element-boyer-moore", "missing-number", "rotate-array", "merge-intervals", "next-permutation", "find-duplicate-floyd"],
  },
  {
    id: "linked-lists-stacks-queues", title: "Linked lists, stacks and queues", level: "INTERMEDIATE",
    summary: "Pointer-based structures and the stack tricks (monotonic stacks, parsing) that turn O(n^2) loops into one pass.",
    outcomes: ["Rewire list pointers safely", "Use a stack to match and evaluate", "Recognise a monotonic-stack problem"],
    steps: ["linked-list-insert-head", "linked-list-insert-tail", "linked-list-search", "linked-list-insert-at-position", "linked-list-delete-value", "linked-list-find-middle", "linked-list-remove-nth-from-end", "linked-list-reverse", "valid-parentheses", "evaluate-postfix", "circular-queue", "next-greater-element", "stock-span", "sliding-window-maximum", "largest-rectangle-histogram"],
  },
  {
    id: "hashing-and-bits", title: "Hashing, maths and bit tricks", level: "INTERMEDIATE",
    summary: "Trade memory for speed with hash tables, then use number theory and bitwise identities to skip loops.",
    outcomes: ["Explain collisions and linear probing", "Use a hash map for two-sum style lookups", "Apply sieve, factorisation and XOR identities"],
    steps: ["hash-table-insert-linear-probing", "hash-table-search", "two-sum-hash", "first-repeating-element", "prime-factorization", "sieve-of-eratosthenes", "power-of-two-check", "count-set-bits-kernighan", "single-number-xor"],
  },
  {
    id: "trees-and-graphs", title: "Trees and graphs", level: "INTERMEDIATE",
    summary: "Traversals first, then searching and ordering on graphs, up to shortest paths.",
    outcomes: ["Run all four tree traversals from memory", "Choose BFS or DFS", "Detect cycles and order tasks", "Explain Dijkstra's greedy choice"],
    steps: ["tree-height", "count-leaves", "binary-tree-preorder", "binary-tree-inorder", "binary-tree-postorder", "level-order-traversal", "bst-search", "bst-find-min-max", "bst-insert", "bfs-traversal", "dfs-traversal", "bfs-shortest-path", "connected-components", "detect-cycle-undirected", "union-find-components", "topological-sort-kahn", "dijkstra"],
  },
  {
    id: "recursion-and-dp", title: "Recursion, backtracking and dynamic programming", level: "ADVANCED",
    summary: "From recursive calls to choose-explore-undo, then to tables that remember answers.",
    outcomes: ["Turn a recursion into a DP table", "Write choose-explore-undo backtracking", "Pick the DP state and the order to fill it"],
    steps: ["fibonacci-recursive", "power-fast-exponentiation", "tower-of-hanoi-moves", "subset-sum-count", "generate-parentheses-count", "n-queens-count", "fibonacci-dp", "climbing-stairs", "min-cost-climbing-stairs", "house-robber", "house-robber-circular", "unique-paths", "decode-ways", "coin-change-min-coins", "coin-change-ways", "subset-sum-dp", "knapsack-01-1d", "longest-increasing-subsequence", "max-product-subarray"],
  },
  {
    id: "greedy", title: "Greedy choices", level: "INTERMEDIATE",
    summary: "Problems where the best local choice is provably safe, and how to tell.",
    outcomes: ["Argue why a greedy choice is safe", "Track a farthest-reach frontier", "Schedule by earliest finish"],
    steps: ["jump-game", "min-jumps-to-end", "merge-intervals", "activity-selection", "best-time-to-buy-sell-stock", "dijkstra"],
  },
];

/** What to learn first. Kept short on purpose: only real dependencies, not everything related. */
export const PREREQUISITES: Readonly<Record<string, readonly string[]>> = {
  "binary-search": ["linear-search"],
  "binary-search-first-occurrence": ["binary-search"],
  "lower-bound": ["binary-search-first-occurrence"],
  "upper-bound": ["lower-bound"],
  "search-rotated-array": ["binary-search"],
  "find-peak-element": ["binary-search"],
  "jump-search": ["binary-search"],
  "selection-sort": ["bubble-sort"],
  "insertion-sort": ["bubble-sort"],
  "shell-sort": ["insertion-sort"],
  "merge-sort": ["insertion-sort"],
  "quick-sort": ["merge-sort"],
  "heap-sort": ["merge-sort"],
  "counting-sort": ["find-maximum"],
  "three-sum-count": ["two-sum-sorted"],
  "container-with-most-water": ["two-sum-sorted"],
  "trapping-rain-water": ["container-with-most-water"],
  "remove-duplicates-sorted": ["move-zeroes"],
  "dutch-national-flag": ["move-zeroes"],
  "smallest-subarray-sum": ["max-sum-subarray-k"],
  "longest-subarray-sum-at-most": ["smallest-subarray-sum"],
  "longest-ones-k-flips": ["longest-subarray-sum-at-most"],
  "kadane-max-subarray": ["prefix-sum"],
  "best-time-to-buy-sell-stock": ["find-maximum"],
  "max-product-subarray": ["kadane-max-subarray"],
  "next-permutation": ["reverse-in-place"],
  "rotate-array": ["reverse-in-place"],
  "find-duplicate-floyd": ["linked-list-find-middle"],
  "linked-list-insert-at-position": ["linked-list-insert-head", "linked-list-insert-tail"],
  "linked-list-delete-value": ["linked-list-search"],
  "linked-list-remove-nth-from-end": ["linked-list-find-middle"],
  "linked-list-reverse": ["linked-list-insert-head"],
  "valid-parentheses": ["stack-push-pop"],
  "evaluate-postfix": ["stack-push-pop"],
  "circular-queue": ["queue-enqueue-dequeue"],
  "next-greater-element": ["stack-push-pop"],
  "stock-span": ["next-greater-element"],
  "largest-rectangle-histogram": ["stock-span"],
  "sliding-window-maximum": ["queue-enqueue-dequeue"],
  "hash-table-search": ["hash-table-insert-linear-probing"],
  "two-sum-hash": ["count-frequencies"],
  "first-repeating-element": ["count-frequencies"],
  "prime-factorization": ["gcd-euclid"],
  "sieve-of-eratosthenes": ["prime-factorization"],
  "count-set-bits-kernighan": ["power-of-two-check"],
  "bst-search": ["binary-tree-inorder"],
  "bst-find-min-max": ["bst-search"],
  "bst-insert": ["bst-search"],
  "level-order-traversal": ["queue-enqueue-dequeue", "binary-tree-preorder"],
  "binary-tree-inorder": ["binary-tree-preorder"],
  "binary-tree-postorder": ["binary-tree-preorder"],
  "binary-tree-preorder": ["tree-height"],
  "bfs-traversal": ["queue-enqueue-dequeue"],
  "dfs-traversal": ["stack-push-pop"],
  "bfs-shortest-path": ["bfs-traversal"],
  "connected-components": ["dfs-traversal"],
  "detect-cycle-undirected": ["dfs-traversal"],
  "union-find-components": ["connected-components"],
  "topological-sort-kahn": ["bfs-traversal"],
  "dijkstra": ["bfs-shortest-path"],
  "fibonacci-recursive": ["factorial"],
  "power-fast-exponentiation": ["factorial"],
  "tower-of-hanoi-moves": ["factorial"],
  "subset-sum-count": ["fibonacci-recursive"],
  "generate-parentheses-count": ["subset-sum-count"],
  "n-queens-count": ["generate-parentheses-count"],
  "fibonacci-dp": ["fibonacci-recursive"],
  "climbing-stairs": ["fibonacci-dp"],
  "min-cost-climbing-stairs": ["climbing-stairs"],
  "house-robber": ["climbing-stairs"],
  "house-robber-circular": ["house-robber"],
  "unique-paths": ["climbing-stairs"],
  "decode-ways": ["climbing-stairs"],
  "coin-change-min-coins": ["climbing-stairs"],
  "coin-change-ways": ["coin-change-min-coins"],
  "subset-sum-dp": ["coin-change-ways"],
  "knapsack-01-1d": ["subset-sum-dp"],
  "longest-increasing-subsequence": ["house-robber"],
  "jump-game": ["find-maximum"],
  "min-jumps-to-end": ["jump-game"],
  "activity-selection": ["merge-intervals"],
  "merge-intervals": ["insertion-sort"],
};

export function pathById(id: string): LearningPath | undefined {
  return PATHS.find((p) => p.id === id);
}
export function pathsContaining(algorithmId: string): LearningPath[] {
  return PATHS.filter((p) => p.steps.includes(algorithmId));
}
export function prerequisitesOf(algorithmId: string): readonly string[] {
  return PREREQUISITES[algorithmId] ?? [];
}
/** The first step of a path that is not in `done` and whose prerequisites are all in `done` (or not in the path), or null when finished. */
export function nextStep(path: LearningPath, done: ReadonlySet<string>): string | null {
  const open = path.steps.filter((s) => !done.has(s));
  return open.find((s) => prerequisitesOf(s).every((p) => done.has(p) || !path.steps.includes(p))) ?? open[0] ?? null;
}
