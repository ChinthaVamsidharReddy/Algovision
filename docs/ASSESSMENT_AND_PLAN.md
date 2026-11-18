# Assessment and implementation plan (2026-11-05)

Scope of the review: `apps/web` (all pages, components, `lib/api.ts`), `apps/api` (identity, catalog, learning, platform filters), `packages/*`, `docs/`, compose and env files.

## Headline finding
The backend has authentication, catalog, progress, bookmark and preference endpoints, but **the web app uses exactly one of them (`/api/v1/health`)**. It is a static visualizer with no accounts, no saved state and no search. The user-visible gaps (login, progress, bookmarks, search) are therefore mostly frontend work, plus two backend gaps (forgot/reset password, local-dev configuration).

## 1. Implemented and working
| Area | Status | Evidence |
| --- | --- | --- |
| Visualization engine, 10 algorithms (19 after this pass) (linked list, arrays, stack, queue, tree) | Working | 558 algorithm tests incl. real javac/python3/g++/gcc, 164 web tests, 54 browser checks |
| Four-language code view synced to steps | Working | per-algorithm anchor tests |
| Input forms, limits, lite profile, URL state, theme, keyboard controls | Working | web tests, smoke test |
| API client with timeout/retry/backoff and server status chip | Working | `lib/api.ts`, `api.test.ts` |
| DB schema (20 tables), Flyway, content sync to PUBLISHED | Verified on PostgreSQL 16 | `verify-*.sh` 23 + 48 checks |
| Auth core (register, login, refresh rotation, logout, throttle) | Core and SQL verified; HTTP layer not compiled | 43 core tests |
| Catalog/progress/bookmark/preference core and SQL | Core and SQL verified; HTTP layer not compiled | 15 core tests, 48 SQL checks |

## 2. Partially implemented / needs improvement
| Item | Problem |
| --- | --- |
| Auth endpoints | Exist but nothing in the web app calls them. No forgot/reset password (table `password_reset_tokens` exists, no code, no mailer). |
| Progress, bookmarks, preferences APIs | Exist, no UI. Preferences (language, theme, speed) are only in browser storage. |
| Catalog | Web reads a static bundled list; the API catalog is unused. Category slugs differ between the two (`linked-list` vs `linked-lists`). |
| Algorithms page | One flat list. No grouping by category/topic, no filters. |
| Local dev setup | `AUTH_TOKEN_SECRET` has no default and Maven does not read `.env`, so `mvn spring-boot:run` fails unless variables are exported by hand. Cookie `Secure` defaults to true. |
| Docs | README still says "milestone 1" and one algorithm. |
| Content breadth | 10 algorithms, 5 categories at audit time. **Resolved:** 19 algorithms in 8 categories in pass 1, then 69 algorithms in 11 categories in pass 2, then 77 algorithms in 12 categories with the graph milestone (section 10). The window view uses the existing `window` highlight role, so no trace-schema change was needed. |

## 3. Missing entirely
Login/register/forgot/reset screens; session handling (in-memory token + silent refresh); user menu and route protection; progress bar and "mark complete"; bookmark toggle and bookmarks page; learning dashboard; search; Arrays, Two Pointers and Sliding Window content; a window highlight for array views.

## 4. Integration issues and bugs found
1. **Every write would be rejected.** The API requires `Origin` plus header `X-AlgoVision-Client: web` on POST/PUT/DELETE. No web code sends the header (only `application.yml` mentions it), so register, login, refresh, view, complete and bookmark calls would all get 403 `ORIGIN_NOT_ALLOWED`.
2. No access-token holder or refresh-on-401 logic exists on the web side.
3. Backend will not start for a developer who only copies `.env.example` (see section 2).
4. Category/topic grouping is defined only inside `tools/content-compiler/catalog-sync.mjs`; the web cannot reuse it. Needs one shared source.
5. `next.config.ts` comment says SameSite=Strict, the cookie is Lax. Comment fix only.
6. The Spring layer (identity, catalog, learning) has still never been compiled; any compile error there blocks everything above. Risk stays until `mvn verify` runs on a real machine.

## 5. Backend changes
- B1 `application-dev.yml` profile: dev-only token secret, `AUTH_COOKIE_SECURE=false`; README/dev guide updated.
- B2 Forgot/reset password: `POST /auth/forgot-password` (always 202, no account enumeration), `POST /auth/reset-password`; token = 32 random bytes, SHA-256 stored, 30 min TTL, single use; reset revokes all refresh tokens; `Mailer` interface with console implementation (approved earlier) so the link is printed in the API log; framework-free core + SQL files + `verify-password-reset.sh` + tests.
- B3 Move the category/topic table out of the sync tool into `packages/algorithms/catalog.json`, read by both the sync tool and the web app.

## 6. Frontend changes
- F1 `apiFetch`: send `X-AlgoVision-Client: web` on non-GET; JSON helper.
- F2 `AuthProvider`: access token in memory only, silent refresh on load and on 401, single-flight refresh, sign-out; header user menu.
- F3 Pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, each with loading, error and retry states and field-level errors.
- F4 Progress: record view on open, "Mark as complete" button, progress bar on `/algorithms` and a `/dashboard` page (percent, per-category bars, continue where you left off).
- F5 Bookmarks: toggle on cards and workspace, `/bookmarks` page.
- F6 Search: client-side over bundled catalog (title, category, topic, technique keywords, summary), header search box, `/` shortcut, `/search` page with ranked results; works offline and signed out.
- F7 Algorithms page grouped by category with difficulty/category filters.
- F8 Array view: shaded window between two pointers for Sliding Window.
- F9 Guests: progress and bookmarks require sign-in; guests see a clear prompt instead of silently failing.

## 7. New content (each needs executor, vectors, Java/Python/C++/C, harnesses, tests)
| Wave | Category | Algorithms |
| --- | --- | --- |
| 4 | Arrays | Find Maximum, Insert at Index, Delete at Index, Prefix Sum |
| 5 | Two Pointers | Two Sum (sorted), Reverse in Place, Remove Duplicates (sorted) |
| 6 | Sliding Window | Max Sum Subarray of Size K, Smallest Subarray with Sum at Least S |
Total 19 algorithms. Trace schema 1.2.0 adds an optional array `window`. Hashing, graphs, DP and recursion topics are not in this pass.

## 8. Decisions made in this plan (override any of them)
- Search is client-side, not an API endpoint (instant, offline, no extra backend).
- Guests cannot save progress; sign in required (avoids a local/server merge).
- Password reset uses the console mailer in dev; real email delivery needs a provider decision later.
- The topic list in section 7 is my selection; tell me if you want others.

## 9. Order of work
Foundation (F1, B1, B3) -> B2 -> F2/F3 auth -> F4 progress -> F5 bookmarks -> F6/F7 search and catalog UI -> content waves 4-6 with F8 -> end-to-end browser test against a stub API, docs, zip.

## 9. Pass 2: complete algorithm library (69 algorithms)
Added 50 algorithms in seven waves (A to G, all `wave: 7` in `algorithm.json`). Every one has an executor, an independent-reference vector file, verified Java, Python, C++ and C solutions with `@a` anchors, four harnesses, and property tests.

| Wave | Category | Algorithms |
| --- | --- | --- |
| A | Sorting and searching | Merge, Quick, Heap, Counting and Shell Sort; Jump Search; Binary Search (first occurrence) |
| B | Arrays, two pointers, sliding window | Kadane, Rotate Array, Move Zeroes, Dutch National Flag, Container With Most Water, 3Sum count, Longest Ones with K flips, Longest Subarray with Sum at most S |
| C | Linked lists | Search, Delete Value, Reverse, Find Middle, Remove Nth From End, Insert at Position |
| D | Stacks, queues, recursion | Valid Parentheses, Next Greater Element, Evaluate Postfix, Circular Queue, Sliding Window Maximum, Factorial, Fibonacci (recursive), Fast Exponentiation, Sum of Digits, Tower of Hanoi (move count) |
| E | Trees | Pre-order, Post-order, Level-order, BST Search, BST Insert, Height, Count Leaves, BST Min/Max |
| F | Hashing | Hash Table Insert and Search (linear probing), Two Sum (hash map), First Repeating Element, Count Frequencies |
| G | Dynamic programming | Fibonacci DP, Climbing Stairs, House Robber, Coin Change, Longest Increasing Subsequence, 0/1 Knapsack (1-D table) |

Design notes:
- No trace-schema change. Recursion is drawn as a call stack (`stack` state); level-order shows its queue as "queued" highlights; hashing and DP use `array` state (hash tables show -1 as an empty slot, DP shows the table).
- The input kinds stay `intList` and `int`. Other data is encoded and explained in the input label (bracket codes 1 to 6, postfix operators -1 to -4, knapsack items as weight/value pairs, circular-queue operations where 0 means dequeue).
- Scalar-only algorithms (factorial, Fibonacci, powers, Hanoi, digits, Fibonacci DP, stairs) have no array; the content test now checks their smallest and largest accepted value instead.
- Limits adapt to the profile where a recursion would otherwise exceed the step budget (Fibonacci and Hanoi lower their maximum n on the lite profile).
- C has no hash map or set; its hashing solutions use a value-indexed array and say so in a comment. Java, Python and C++ use their standard hash collections.

Graph algorithms were left out of pass 2 because they need a new state kind; they are section 10.

## 10. Graph milestone (77 algorithms, trace schema 1.2.0)
A new `graph` state kind was added to the trace schema as a backward-compatible minor version (1.1.0 to 1.2.0). Existing traces and the other five state kinds are unchanged. Full description: `docs/EXECUTION_TRACE_SCHEMA.md`, graph section.

| Algorithm | Notes |
| --- | --- |
| BFS traversal, DFS traversal (recursive) | Visit order; BFS shows the queue, DFS shows the call stack |
| Shortest path, unweighted (BFS) | Distance under every vertex, -1 for unreachable |
| Connected components | Stack flood fill; component number under every vertex |
| Detect a cycle (undirected) | BFS with parents; stops at the first cycle |
| Topological sort (Kahn) | Directed; in-degree under every vertex; empty result on a cycle |
| Dijkstra | Undirected, positive weights 1 to 99, O(V²); candidates shown as the work list |
| Union-Find | Path halving; shows the parent array and the falling group count |

Design notes:
- The input kinds stay `intList` and `int`: `values` is a flat edge list (`from, to` pairs, or `from, to, weight` triples for Dijkstra), plus `vertices` (1 to 8) and, where it matters, `start`.
- Limits: at most 8 vertices, and the edge list may be twice as long as an array input (30 numbers standard, 16 lite). Vertices are drawn on a circle, so the picture never moves while the algorithm runs.
- Solutions in all four languages build an adjacency matrix from the edge list first (the `build-graph` anchor). C and C++ share one source because they use fixed `[8][8]` arrays and plain functions.
- Directed graphs reject an edge listed in both directions between the same two vertices (the drawing would overlap).


## 11. Interview core I milestone (109 algorithms, 16 categories)

- 32 new algorithms (batches I, J, K): array patterns and binary-search variants, monotonic stacks, math, bit tricks, greedy, backtracking and classic dynamic programming. No new input kind and no trace-schema change (still 1.2.0).
- New categories: Backtracking, Greedy, Math, Bit Manipulation (shared `catalog.json`, synced to the database by the repeatable migration).
- Recursion-heavy demos (subset count, N-Queens, parentheses) cap their input by limit profile (for example N-Queens n <= 5 standard, 4 lite) so the worst case stays inside the step budget; the tests assert this per profile.
- Every algorithm is covered by a reference-implementation property test, lite-profile worst-case test, shared vectors (empty, single, limit) and the real javac/python3/g++/gcc conformance run.


## 12. Learning experience milestone

- New module `packages/algorithms/src/learning/`: `paths.ts` (8 paths, prerequisites, next-step logic), `practice.ts` (practice links), `quiz.ts` (deterministic quiz generator over a trace). Tests (`test/learning.test.ts`) assert that every algorithm is on a path, prerequisites exist and are acyclic and ordered, and every generated question is true to the trace for all 109 algorithms.
- New pages: `/paths`, `/paths/[slug]`, `/compare`, `/cheatsheet`; new panels on the algorithm page (prerequisites, paths, practice, compare link, quiz).
- No schema, API or database change. Navigation gained Paths and Compare (header), and Cheat sheet (menu and footer).
- Accessibility: radio-group quiz, tables with captions and row headers, `sr-only` text kept inside `relative` scroll containers (an absolutely positioned screen-reader span had caused page-wide sideways scroll on phones).


## 13. Strings milestone (116 algorithms, 17 categories, trace schema 1.3.0)

- New `text` input kind (lowercase a-z, up to the profile's array length, so 15 standard and 8 lite). It is validated in the executor, typed in the content contract, and sent to the Java, Python, C++ and C test harnesses as character codes, so the existing harness reader is reused.
- Trace schema 1.3.0 adds an optional array flag `chars` so a string is shown as character cells. Backward compatible; no new state kind.
- 7 algorithms in a new Strings category (wave L): valid palindrome, first unique character, longest substring without repeats, longest palindromic substring, count palindromic substrings, run-length compression length, longest repeating character replacement. New learning path "Strings".
- Not done (needs a new grid state and a list-of-lists output): edit distance, LCS, grid problems, linked-list cycle and merge. Listed for a later milestone.


## 14. Grid milestone (123 algorithms, trace schema 1.4.0)

- New `grid` input kind: rows of digits written like `110, 011`. Limits per profile: 6 x 6 standard, 4 x 4 lite (`maxGridSide`), and 8 letters standard, 5 lite for the two-string tables (`maxDpText`), so every trace stays inside the step budget.
- Trace schema 1.4.0 adds the `grid` state with optional row and column labels, a validator, a layout module, an SVG view and a screen-reader description.
- 7 algorithms: number of islands, max area of island, rotting oranges (BFS by minutes), minimum path sum (in-place DP), spiral order (list output from a grid), longest common subsequence and edit distance (tables labelled with the two texts). All are on learning paths with prerequisites and practice links.
- Test harnesses for grid inputs send "rows cols v..." and for two texts send two "n codes" groups, so the existing int reader is reused in Java, Python, C++ and C.
- Still deferred: KMP and string matching tables, linked-list cycle and merge (need a second list input), word search and other grid problems with letters, 2D prefix sums.

## 15. Code practice milestone (in the browser, JavaScript and Python)

Decision D3: run learner code **in the browser only**, in JavaScript and Python. A separate sandbox service (for Java, C++ and C) is deferred.

- Routes: `/practice` (index with solved marks) and `/practice/[slug]` for all 123 algorithms, built statically. Each page states the task, inputs, return value, target complexity and an example, then offers an editor, Run tests, a results table and a collapsible console. Drafts and solved marks stay in `localStorage` (guarded, the page works without it). Nav, footer and every algorithm page link to it.
- Tests come from each algorithm's `vectors.json`, compiled to `src/generated/codepractice.ts` (arguments in `io.inputs` order, expected value). Content compiler `--check` verifies the file is current.
- Function contract: define the function named in the task (Python `snake_case`, JavaScript `camelCase` of it). Pass means the returned value equals the expected one (booleans count as 0 or 1). In-place style also passes: return nothing and the changed first argument is compared, or return a count `k` and the first `k` values are compared.
- Algorithms whose reference code is built around helpers (28 of them) have a `practice` override in `algorithm.json`: `fn`, an explanatory `note`, and an optional `adapter`. `list` gives you the head of a linked list (`ListNode(val, next)`), `tree` the root of a binary search tree (`TreeNode(val, left, right)`), built from the first input; returned nodes are read back into values.
- JavaScript runs in a classic Web Worker (`public/practice/js-worker.js`). Python runs in Pyodide 0.27.7 inside a Web Worker (`py-worker.js`), self-hosted from `public/pyodide` (copied from the npm package by `scripts/copy-pyodide.mjs` at dev and build time, about 14 MB, git-ignored, downloaded only when Python is first run, then cached by the browser).
- Safety limits: the page terminates a worker whose test runs longer than 2 s (JavaScript) or 5 s (Python), marks the remaining tests "Not run" and starts a fresh worker on the next run. Network APIs are removed inside the workers. **This protects the learner from their own infinite loop; it is not a security boundary.** Learner code only ever runs in the learner's own browser.
- Loading and failure states: Pyodide has a loading message, a 60 s load limit and a Try again button; a syntax error or missing function is reported before any test runs.
- Docker image now also copies `apps/web/public`; Vercel needs no change (`pnpm build` runs the copy step).
- Not changed: API, database, trace schema, the 123 algorithms.
- Deferred: Java, C++ and C execution (needs the sandbox service), hidden tests, code history, submitting results to the server.

## 16. Heaps and AVL milestone (milestone 13, part 1)

- New category **Heaps** (sort 82, topic "Heaps and Priority Queues") and a new **Heaps and priority queues** learning path; AVL joins "Trees and graphs".
- Four algorithms, all on the existing tree state, so the trace schema is unchanged (1.4.0): `min-heap-build-insert` (sift-up), `heapify-bottom-up` (Floyd, O(n)), `kth-largest-element` (size-k min-heap, input `values` and `k`) and `avl-tree-insert` (single and double rotations, result is the final height).
- Heaps are drawn as a complete binary tree; node `t{i+1}` is array index i, so a swap changes two node values and the picture matches the array layout.
- Tree traces may only use the events init, call, return, visit and done, so compares and swaps are described by highlights and text rather than events.
- Tests: wave tests with independent references (heap arrangement, k-th largest by sorting, AVL balance, sorted in-order and height), step budgets at standard and lite limits, real Java/Python/C++/C conformance (16/16), DB verification (127 algorithms, 508 language rows, 485 distinct hashes, 18 categories).
- Not done: trie (needs an n-ary node state, which is a schema decision for you), segment tree, Fenwick, MST, SCC, LRU.

## 17. Structures milestone (milestone 13, part 2)

You asked me to decide based on how the application is built, so the decisions were:

- **Only existing state kinds, no schema change (still 1.4.0).** Four algorithms: `fenwick-tree-prefix-sum` (array state, the array drawn is the tree, cell k is position k + 1), `segment-tree-range-sum` (tree state with the build and query recursion on the call stack; a new node shows 0 and a "?" label until its sum is known), `kruskal-mst` (weighted graph, total weight of the cheapest spanning forest, vertex marks show the union-find group, the list shows accepted weights) and `strongly-connected-components` (Kosaraju, directed graph, call stack as the work list, vertex marks show the component).
- **Trie is deferred to its own milestone.** A trie node has many children, so it needs a new n-ary tree state (schema 1.5.0), a layout and a view. That is a bigger, user-visible change than this part should carry.
- **LRU cache is deferred.** It needs an operation-sequence input kind (get and put calls), which is also new input and view work.
- New learning path "Range queries, groups and spanning trees" (7 steps); prerequisites and LeetCode links added.
- Input rules: Fenwick `index` and segment tree `left` and `right` must lie inside the array (left not bigger than right); graph inputs follow the existing edge-list rules (up to 8 vertices; weights 1 to 99; no edge listed in both directions).
- Verified: wave tests with independent references (prefix sums, Prim for the spanning forest, transitive closure for components), step budgets at standard and lite, real Java/Python/C++/C conformance (16/16), DB verification (131 algorithms, 524 rows, 499 distinct hashes, 18 categories).


## 18. Trie milestone (milestone 14)

- **Schema 1.5.0, new `trie` state kind** (minor change, 1.4 traces still accepted). A trie node has up to 26 children reached by labelled edges, which the binary tree state cannot express. Nodes carry `label`, `count` and ordered `children`; the state also carries the `word` being inserted and how many letters are done. See EXECUTION_TRACE_SCHEMA.
- **Two algorithms in the Strings category, both suffix tries** (every suffix of the text is inserted): `trie-distinct-substrings` (nodes created = distinct substrings) and `longest-repeated-substring` (deepest node with a count of 2 or more). I chose suffix tries because the existing text input (one lowercase string) fits them. A word-list trie (insert, search, starts-with) needs a list-of-words input, so it waits with the LRU cache for an operation-list input kind.
- Code: Java, C++ and C use a flat `next[node][26]` table (index 0 = no child) sized for the worst case n(n+1)/2 + 1 nodes; Python uses nested dicts. Every language marks the same anchors.
- View: a new trie view with leaves in their own columns and parents centred over their children (width follows leaf count, not node count), the letter on each edge, the suffix being inserted with its done letters greyed, and counts inside the nodes when tracked. The picture is a pure function of the state.
- The strings learning path grew from 7 to 9 steps; LeetCode links added.
- Tests: trace-schema 56 (7 new trie rules), wave tests with independent references (substring sets, occurrence counts per node), step budgets at standard and lite, real Java/Python/C++/C conformance, web layout, description and axe checks.
- Not done: word-list trie, LRU cache.

## 19. Operation lists milestone (milestone 15) and CI repair

- **New input kind `ops`** (no trace schema change except one optional trie field). A learner writes `put 1 10, get 1`; the page converts it to one flat integer list (`code, n, values...`, letters as character codes). It is deliberately an `intList` on the wire, so the four-language harnesses, the practice page and the Python/JavaScript runners needed no new input handling. Each algorithm declares its operations in `algorithm.json`; the parser explains every mistake in words (unknown operation, wrong number of values, number out of range, too many operations, bad word).
- **`lru-cache`** (Linked Lists): get and put on a cache of capacity 1 to 4. The code keeps a doubly linked list in slot arrays plus a direct-address table indexed by key, so both operations are O(1); the picture draws the list from most recent (head) to least recent (tail) with each node labelled by its key. The answer is the sum of the values returned by get (a miss counts as -1).
- **`trie-insert-search`** (Trees): insert, search and prefix on words of 1 to 6 letters. The trie state gained an optional `end` flag (double ring) for word ends; it stays at schema 1.5.0 because it is optional and 1.5.0 has not been released.
- Limits: up to `maxArrayLength` operations (8 lite, 15 standard), keys and values within +-999.
- Learning: the LRU cache joins "Linked lists, stacks and queues", the word trie joins "Strings" before the suffix tries.
- **CI repair** (the GitHub workflow was failing in two jobs): (1) `browser-smoke` never installed the Playwright package that `smoke.mjs` imports and ran the standalone server without `.next/static` and `public`, so the page could not load; the job now installs Playwright, copies both folders (as the Dockerfile does) and starts the stub API, and I ran that exact flow locally (433 of 433). (2) `api`: `MigrationIT` starts the whole Spring context, but `auth.token-secret` has no default on purpose, so the context could not start; the test now supplies a throwaway secret and the job sets `AUTH_TOKEN_SECRET`. The Spring change could not be run here (Maven Central is blocked), so it is verified only when you push. `setup-java` moved to v5.
- Not done: engagement and the AI tutor (next, in that order), syncing solved practice marks.

## 20. Engagement milestone (milestone 16) and a security patch

- **Everything is derived, nothing is a counter.** `lib/engagement.ts` is a pure function of facts that already exist: the server progress entries (started, completed, with timestamps), the practice solved marks (now stored with the local day they were first solved; old "1" marks still count), and a small local activity log of days. XP (5 per algorithm opened, 20 per algorithm completed, 30 per practice problem solved, 100 per finished path), the level (level n needs 100 + 50 (n - 1) XP), the streak (current and longest, a streak stays alive until the end of the next day) and the badges are recomputed each time, so they cannot drift or double count and stay correct after a re-sync.
- **No backend change.** The server already stores per-algorithm progress with dates; the streak merges those dates with the local log. I deliberately did not add tables or endpoints because the Spring layer cannot be run here and the CI `api` job was already failing; syncing practice solved marks to the server stays a later option.
- **Badges** (static ones for completions, solves, streaks and finishing a path, plus one per learning path and one master badge per category) show earned ones and, in a collapsible list, the progress toward the rest.
- **Certificates:** `/paths/<path>/certificate` shows a printable certificate (name from the account, path, outcomes, completion day) only when every step is completed; otherwise a progress bar explains what is missing. It says plainly that it is a record of study, not an accredited qualification, and makes no verification claim.
- **Dashboard** gained a "Level, streak and badges" section with the certificate links. The path page shows a "Get your certificate" button when the path is done.
- **Security:** `next` 16.4.3 is affected by a published moderate advisory (information disclosure across root params through `unstable_cache`, GHSA-mfr8-8qww-v76h; patched in 16.4.5). The build itself refused to run on it (exit code 1), which would also break CI. I updated within the existing range to 16.4.6 (`^16.4.6`, lockfile updated); `pnpm audit --prod` now reports no known vulnerabilities, and the build and all tests pass.
- Not done: AI tutor (needs a provider decision), syncing practice solved marks to the server, and streak freezes or leaderboards (deliberately left out).

## 21. Offline and review milestone (milestone 17; the AI tutor is paused)

- **Installable offline app.** `app/manifest.ts` (standalone, icons incl. maskable, shortcuts), generated icons in `public/icons`, and a hand-written service worker `public/sw.js`, registered only in production builds. Static build files, the practice runtime (Pyodide) and icons are cached on first use; pages are network-first with the last copy as the offline fallback and `/offline` for pages never opened. `/api/*` and Next's in-app navigation data requests are never intercepted, so sign-in and progress always reach the server and show their own error states. Page HTML is identical for everyone, so caching it exposes no one's data. `sw.js` is served with `no-cache`. Bump `VERSION` in the worker to drop old caches. No dependency was added (a plugin would have meant another package and build step for about 60 lines of worker).
- **Spaced repetition** (`lib/review.ts`, pure functions plus guarded storage): Leitner boxes with gaps of 1, 3, 7, 14, 30, 60 days. Cards come from finished algorithms (signed in), solved practice problems (this browser) and a "Remind me to review" switch on each algorithm page; removing a card mutes it so syncing does not bring it back. `/review` asks for recall first, then reveals the summary and complexity, then "I remembered it" (next box) or "I forgot" (box 0, tomorrow). Works signed out.
- **Notes** (`lib/notes.ts`): a private note per algorithm (4000 characters, saved shortly after typing stops), shown under each algorithm. Deleting the text deletes the entry.
- **Local only, by decision.** Review schedule and notes live in this browser, like drafts and solved marks, because the Spring layer cannot be built or tested in this environment. Syncing all three to the server is the open follow-up.
- Tests: review and notes 13 unit tests, review page and notes box 6 UI tests, a real-browser `e2e/offline.mjs` (manifest, icons, worker headers, offline reopen of visited pages, offline page for new ones, API never cached, notes survive reload, a full review round, axe in both themes, 375px) now also run in CI.
- Not done: install prompt button, update-available toast, background sync, server sync of review and notes.

## 22. Story mode (milestone 17b)

- **Idea:** retell an algorithm as an everyday scene so it is remembered (a tortoise and a rabbit, two friends at a gift shelf, a line of kids that is a mirror), with every step narrated in the story's words and the matching line of code shown ("In the code: slow = nums[slow]").
- **Decision: a story is a pure function of the existing trace, with no schema change.** `lib/stories/<id>.ts` exports a `Story` (title, situation, cast, moral, `frame(step, trace)`); `frame` reads the step's variables, anchor and array state and returns cells, actors, narration, an optional budget meter and a result banner. Because it uses the same steps as the code panel and the normal view, the story cannot disagree with the program. Adding a story is one file plus one line in `lib/stories/index.ts`.
- **UI:** `components/story/story-panel.tsx`, shown above the normal visualization (which stays, so every existing test and view is unchanged), with the controls directly under the scene. Characters slide between cells (motion-safe), share a cell side by side, the scene shrinks to fit phones, and the whole story can be hidden (remembered in this browser). The scene is decorative to screen readers; the narration line is the live region.
- **First three stories:** `find-duplicate-floyd` (Tortoise and Rabbit in a park of signboards), `two-sum-sorted` (two friends, one shared budget, with a budget meter), `is-palindrome-string` (the mirror line).
- **Tests:** every step of every test vector of each story is replayed (clean text, valid positions, result banner equals the algorithm's expected answer, the friend told to move is the one the algorithm moves), UI tests, and `e2e/story.mjs` (all steps, actor overlap, phone fit, axe in both themes, hide and remember), now also in CI. The first run found a real bug (the animals vanished on the last step, because that step only records the answer) and a pre-existing accessibility gap (sideways-scrolling visualization areas were not keyboard-focusable at phone width); both fixed.
- **Authoring rule for later stories:** pick an everyday situation where each variable has a character, state what every branch means in the story, and always add the "In the code" line. Stories for array-state algorithms only for now; other state kinds need their own scene layout.
- Not done: stories for the remaining algorithms (next batches), non-array scenes (linked lists, trees, graphs), story-based quiz questions.

