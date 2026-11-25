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

### Story mode, batch 2 (seven stories in total)

- Added `binary-search` (The Phone Book Trick: start and end flags, a peek in the middle, thrown-away halves crossed out), `dutch-national-flag` (Sorting the Sock Pile: red slot, sorter, blue slot; red, white and blue socks; finished zones turn green), `container-with-most-water` (The Farmer's Pond: two posts, a strip under each post showing its height, running best pond) and `reverse-in-place` (Flipping the Bookshelf: two hands swapping the outer pair and stepping inward).
- Small generic addition: an optional `bar` on a story cell draws a strip at the foot of the cell (heights, sizes).
- Extra tests beyond "clean text": the final frame equals each vector's expected answer (book number or absent, sorted colours, best area, reversed order), crossed-out books are exactly those outside the flags, the sock zones really hold the right colours at every step, and the post moved is always the shorter one.
- Still array-state only. Candidates for the next batches: sliding-window maximum, two-sum with a hash map, move zeroes, remove duplicates, the sorts (bubble, selection, insertion), then linked-list and graph scene layouts.


### Story mode, batches 3 and 4 (21 stories in total)

- **Batch 3, more row-based stories (8):** `linear-search` (lockers), `bubble-sort`, `selection-sort`, `insertion-sort` (kids by height, a card hand), `move-zeroes`, `remove-duplicates-sorted`, `two-sum-hash` (a notebook derived by replaying the trace) and `kadane-max-subarray` (a running streak against the best streak). Each is replayed over every test vector and its final banner is checked against the vector's expected answer. Sliding-window maximum is deferred: its state kind is a queue, which needs its own scene.
- **Batch 4, a new scene for linked lists (6):** `linked-list-reverse` (conga line), `linked-list-find-middle` (tortoise and rabbit on a train), `linked-list-remove-nth-from-end` (two runners joined by a rope), `linked-list-search` (a detective checking coaches), `linked-list-insert-head` (a new engine coach) and `linked-list-delete-value` (a mechanic uncoupling a coach).
- **Decision: the chain scene reuses the real linked-list layout** (`layoutLinkedList`, which gained an optional `room` argument for extra headroom), so the story shows the true pointers, the true detached chains and the true head, and cannot drift from the normal view. A `ChainStory` returns a colour per node id, characters standing on a node id (or `"end"` for the end of the list) and the same narration, code line and banner as a row story. `StoryShell` (title, hide/show, scaling, narration, situation and cast, moral) is shared by both scenes, and `Story | ChainStory` are both served by `storyFor`.
- **Tests:** generic replay of every chain story on every vector (valid node ids, clean words), final state or banner equal to each vector's expected list or index, ChainPanel and workspace UI tests with axe, and `e2e/story.mjs` now covers 21 stories on desktop and phone (overlap checked on both axes because detached nodes sit in rows above). Real bugs found by these: the empty-list cases (a story said "dancer undefined"), and tones pointing at a node that the final state has already removed.
- **Status:** the story layer is array-state and linked-list only; trees, graphs and the queue-based algorithms are the remaining scenes.

### Story mode, batches 5 and 6: trees and graphs (32 stories in total)

- **Batch 5, trees (6):** `binary-tree-inorder` (museum tour), `binary-tree-preorder` (welcome round), `binary-tree-postorder` (closing time; the three share `tree-tour.ts`), `bst-search` (finding a house number on a forked street), `bst-insert` (building a new house at the empty plot) and `tree-height` (counting generations of a family).
- **Batch 6, graphs (5):** `bfs-traversal` (a rumor spreading in rings), `dfs-traversal` (a maze and a ball of thread), `bfs-shortest-path` (fewest metro stops), `dijkstra` (cheapest delivery route) and `topological-sort-kahn` (chores that wait on each other, including the circular case).
- **Decision: both scenes reuse the real layouts** (`layoutTree`, `layoutGraph`), so the story shows the true tree and the true graph with the true active edge. `TreeStory` and `GraphStory` return the same frame as a chain story (a colour per node, characters standing on nodes, narration, code line, banner, board); graph frames add small badges under vertices (distance, cost, waiting count). All scenes share `StoryShell`. Story-only SVG attributes use a `data-story-` prefix so they never collide with the normal views or their tests.
- **Tests:** every tree and graph story is replayed over every vector (valid node ids, clean words), and its final banner or board is compared with the vector's expected answer (traversal order, found or not found, generations, distances, valid order or cycle). Panel and workspace tests include axe, and `e2e/story.mjs` walks all 32 stories on desktop and phone. Real bugs found: empty-tree cases printed "undefined", topological sort has a `cycle-found` anchor and an `enqueue-zero` step with no vertex, and story attributes collided with three existing graph tests.
- **Still without a story scene:** the queue/stack, heap, grid/DP, string, trie and union-find algorithms, plus sliding-window maximum.

### Story mode, batch 7: grids and dynamic programming (39 stories in total)

- **Tables (3):** `min-path-sum` (a toll-road robot), `longest-common-subsequence` (two playlists) and `edit-distance` (fixing a typo). Each cell shows its toll or total, the cells that feed the new one are captioned (above, left, diagonal; delete, insert, replace) and a pencil or robot stands on the cell being filled.
- **Maps (4):** `number-of-islands` and `max-area-of-island` (an island map walked by an explorer; both share `island-core.ts`), `rotting-oranges` (rot spreading minute by minute, with a minute and fresh-orange board) and `spiral-order` (a snail eating a lettuce patch; the order is read from what each step newly marks as found, in the order the algorithm lists it).
- **Decision: the grid scene reuses the real grid layout** (`layoutGrid`, same headers and row-major order). A `GridStory` colours cells by index, can replace a cell's number with a picture or add a caption, and puts a small character on a cell. It shares `StoryShell` with every other scene.
- **Tests:** every grid story is replayed over every vector (valid cell indexes, clean words with no question marks left from missing values), and its final banner is compared with the vector's expected number, count, size, minutes or spiral order. Panel and workspace tests include axe, and `e2e/story.mjs` walks all 39 stories on desktop and phone. A real bug found: the spiral order came out wrong because a Map iterated cells in the order they were first highlighted rather than in the order the algorithm listed them.
- **Still without a story scene:** heaps and priority queues, strings, tries, union-find, segment tree and Fenwick tree, the stack and queue algorithms, and sliding-window maximum.

### Story mode, batch 8: stacks and queues (47 stories in total)

- **Containers (2):** `stack-push-pop` (a pile of plates, with the "empty plate pile" underflow case) and `queue-enqueue-dequeue` (a ticket counter).
- **Brackets and arithmetic (2):** `valid-parentheses` (boxes with lids of the right kind; a wrong or missing lid ends the story with the reason) and `evaluate-postfix` (numbers wait on a pile, an operator takes the top two).
- **Monotonic structures (4):** `next-greater-element` (people waiting for someone taller), `stock-span` (how long today has been the best), `largest-rectangle-histogram` (the biggest billboard against a skyline, including the zero-height end marker) and `sliding-window-maximum` (a line of candidates for the tallest in the window; the only queue story).
- **Decision: a new "pile" scene.** Stack and queue traces hold only a list of items, so a `PileStory` draws the input as a strip with a pointer above and the container below: a stack stands up with its top marked, a queue lies down with front and back marked. Answers that the final step does not carry (next-greater list, spans, window maxima) are replayed from the variables of earlier steps. The container keeps one size for the whole run so nothing jumps. It shares `StoryShell` with every other scene. `circular-queue` has array state and is left for a later batch.
- **Tests:** every pile story is replayed over every vector (item count equals the state, clean words, strip length equals the input), and its final banner is compared with the vector's expected answer. Panel and workspace tests include axe, and `e2e/story.mjs` walks all 47 stories on desktop and phone. Real bugs found: valid-parentheses printed "?" at the mismatch step because the trace drops the current character there, and largest-rectangle crashed on the end-marker item pushed after the last building. Screenshots also showed the queue's "front" and "back" captions colliding with one item and the pointer overlapping the strip label; both fixed.
- **Still without a story scene:** heaps and priority queues, strings, tries, union-find, segment tree and Fenwick tree, circular-queue and the remaining array algorithms.

### Story mode, batch 9: heaps (51 stories in total)

- **Company-chart stories on the tree scene (3):** `min-heap-build-insert` (new hires climb the ladder while they are more senior than their boss), `heapify-bottom-up` (managers are fixed from the lowest group back to the top) and `kth-largest-element` (a podium with k places whose weakest score sits at the top; a newcomer must beat it). A board shows the heap as a list, top desk first.
- **Row story (1):** `heap-sort` (Crowning the Champions): the array is a row of desks where desk d's reports sit at desks 2d and 2d+1; the champion at desk 1 is swapped to the last desk of the chart, which becomes final, while the new boss sinks. Heap sort has array state, so it uses the existing row scene.
- **Decision: no new scene.** The three heap algorithms already have tree state with positional ids (`t1`, `t2`, ...), so the real tree layout is reused and `heap-util.ts` only maps array positions to node ids and highlight roles to colours. Colours come from the algorithm's own highlights, so the story cannot disagree with the code.
- **Tests:** every story is replayed over every vector (valid node ids, clean text), the final banner and board are compared with the vector's expected heap or k-th value, heap-sort's last row equals the expected sorted row with every cell final, and a workspace test with axe covers a heap algorithm. `e2e/story.mjs` walks all 51 stories on desktop and phone.
- **Still without a story scene:** the rest of the tree algorithms (level-order, count-leaves, min/max of a search tree, AVL insert), strings, tries, union-find, segment tree and Fenwick tree, circular-queue and the remaining array algorithms.

### Story mode, batch 10: the remaining tree algorithms (55 stories in total)

- **Four stories on the tree scene:** `level-order-traversal` (a hotel guide visits floor by floor with a waiting line; queued rooms are read from the algorithm's own "queued" highlights), `count-leaves` (dead-end houses: each house adds the answers of its two sides; the house that answers is read from the previous step), `bst-find-min-max` (turn left to the end, then right to the end) and `avl-tree-insert` (a village that never leans: the balance factor of each house on the way back up, and the rotations that fix a lean).
- **Decision: no new scene or schema change.** All four reuse the real tree layout. `heap-util.ts` gained `treeTones`, which also maps the roles visited, pointer and the "queued" label to colours.
- **Tests:** every story is replayed over every vector (valid node ids, clean text), and the final banner is compared with the vector's expected order, leaf count, smallest and largest, or AVL height. A workspace test with axe covers the AVL page, and `e2e/story.mjs` walks all 55 stories on desktop and phone. Real bugs found: count-leaves said "house undefined" for a call on an empty side and for an empty tree, and the empty level-order trace has no finish step, so its "empty" banner is now shown on the entry step.
- **Still without a story scene:** strings, tries, union-find, segment tree and Fenwick tree, hash tables, circular-queue, and the remaining array algorithms.

### Story mode, batch 11: strings and tries (64 stories in total)

- **A trie scene (3 stories):** `trie-insert-search` (a dictionary of letter roads: build a road when it is missing, a double ring where a word ends, yes or no answers collected on a board), `trie-distinct-substrings` (every ending of the text is walked along the roads; every room that has to be built is a new piece) and `longest-repeated-substring` (rooms count the endings that walk through them; the deepest room with two or more is the answer, and the story names the piece itself).
- **Six string stories on the existing row scene:** `longest-substring-no-repeat` (a banner that may never cover two tiles with the same letter), `longest-repeating-replacement` (a paint crew with k repaints), `count-palindromic-substrings` and `longest-palindromic-substring` (mirrors around each centre; they share `palindrome-core.ts`) , `first-unique-character` (two walks: tally, then the first loner) and `string-compression-length` (a shorthand writer whose finished shorthand has exactly the expected length).
- **Decision: one new scene.** Trie state (schema 1.5) has its own layout, so `TriePanel` reuses the real `layoutTrie`, writes the edge letter inside each node, draws a double ring for a word end, and shows the letters being walked above the tree with a pointer. Levels are spaced 1.55 times further apart than in the normal view, so a character standing on a node never covers its parent. No trace-schema change.
- **Tests:** every trie story is replayed over every vector (valid node ids for tones, characters and badges, clean words); banners are compared with the vector's expected answer, the repeated piece is checked to really occur twice in the text, and the compression shorthand's length is checked against the expected answer. Workspace tests with axe cover a trie page. In `e2e/story.mjs`, a new check requires that a character never covers a node other than its own, for every linked-list, tree, graph and trie scene. It found the root-covering bug in the first trie layout.
- **Known:** in grid scenes (dynamic-programming tables, maps) the small characters can touch the caption of the cell above them, so grid scenes are exempt from that check.
- **Still without a story scene:** union-find and the other graph algorithms (components, cycle detection, Kruskal, strongly connected components), segment tree and Fenwick tree, hash tables, circular-queue, and the remaining array, dynamic-programming, greedy, searching, sorting, math, bit and recursion algorithms.

### Story mode, batch 12: union-find, graph leftovers, segment and Fenwick trees (71 stories in total)

- **Five stories on the graph scene:** `union-find-components` (friend circles and their leaders; the badge under a person is who they answer to, ★ for a leader), `connected-components` (a painter gives each region of linked towns a colour), `detect-cycle-undirected` (a rumour that comes back by a second route; the badge says who told each person), `kruskal-mst` (the cheapest road network: cheapest road first, skipped if both villages are already connected; the board shows the prices taken and the bill) and `strongly-connected-components` (one-way streets; walk 1 numbers places by finishing order, walk 2 on turned-around streets numbers neighbourhoods).
- **One story on the tree scene:** `segment-tree-range-sum` (a pyramid of notebooks: ask a notebook, read it whole when it is inside the range, add 0 when outside, split when partly inside; the board lists the notebooks read whole).
- **One story on the row scene:** `fenwick-tree-prefix-sum` (shortcut notebooks: each position totals the last (j & -j) days; the clerk jumps by the lowest set bit when writing and when summing).
- **Decision: no new scene or schema change.** The traces already carry parents, groups and components in `marks`, and the segment tree uses the real tree layout; `graph-util.ts` gained `gid`, `plural` and `marked`.
- **Tests:** every story is replayed over every vector (valid ids, clean text); final banners are compared with the vector's expected number of circles, regions, neighbourhoods, loop or no loop, total cost, range sum and prefix sum; the workspace mounts the new stories.
- **Still without a story scene:** hash tables, circular-queue, linked-list insert at a position or tail, LRU cache, recursion, and the remaining array, dynamic-programming, greedy, searching, sorting, sliding-window, maths, bit and backtracking algorithms (batch 13 onwards).

### Story mode, batch 13: hash tables, circular queue and linked-list leftovers (79 stories in total)

- **Five stories on the row scene:** `count-frequencies` (a vote tally sheet), `first-repeating-element` (a doorman with a guest list), `hash-table-insert-linear-probing` (lockers with taken doors, wrapping round), `hash-table-search` (following the same trail and stopping at a free locker) and `circular-queue` (a ring of waiting chairs with a front marker and a next-chair marker). A small `ledger-util.ts` maps highlight roles to colours and builds the cells.
- **Three stories on the chain scene:** `linked-list-insert-tail` (a walker goes to the last coach), `linked-list-insert-at-position` (couple the new coach forwards first, then backwards) and `lru-cache` (a coat rack: the ticket number comes from the trace's own `k=` labels, the order is shown on the board).
- **Decision: no new scene or schema change.** Everything is read from the existing traces.
- **Tests:** every story is replayed over every vector; banners are compared with the vector's expected tally, repeat, final table, locker, waiting list and cache total; the workspace mounts four of them.
- **E2E rule relaxed:** a phone scene of up to 7 cells may now have scale 1 (it needs no shrinking) as long as nothing scrolls sideways; it used to demand a scale below 1.
- **Still without a story scene:** recursion (5), and about 50 array algorithms (dynamic programming, greedy, searching, sorting, sliding-window, maths, bit, backtracking), in batches 14 onwards.

### Story mode, batch 14: searching (86 stories in total)

- **Seven stories on the row scene:** `binary-search-first-occurrence` (the leftmost copy on a shelf: a match is recorded in green and the search keeps going left), `lower-bound` and `upper-bound` (raffle tickets: "where would my number sit?" and "just past my number"; one shared retelling in `bound-core.ts`, the answer can be one past the end), `jump-search` (hopping through chapters, then reading one chapter), `find-peak-element` (a hiker in fog on a ridge drawn with bars), `search-rotated-array` (a turned dial: one half is always still in order) and `find-maximum` (the tallest in a line with a trophy).
- **Decision: no new scene or schema change.** Cells, pointers and highlights from the existing traces carry everything; `ledger-util.ts` gained `barsOf` and `outside`.
- **Tests:** every story is replayed over every vector (clean text, valid ids); final banners are compared with each vector's expected index or value (first occurrence, bound spot, jump index, rotated index, peak index, maximum); the workspace mounts three of them. Edge cases covered: empty arrays, answer one past the end, absent targets.
- **Fixes found on the way:** a bookmark character collided with the End flag (now the bookmarked book is simply shown in green); jump-search said "null" for an empty list; the board forgot the chapter size after the first step.
- **Still without a story scene:** recursion (5) and about 43 array algorithms (sorting, dynamic programming, greedy, sliding-window, maths, bit, backtracking), in batches 15 onwards.
