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
