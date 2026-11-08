# AlgoVision (provisional name)

Interactive DSA learning: watch an algorithm run step by step, with the matching line highlighted in Java, Python, C++ or C.

## Status

Working end to end in the browser (against the API contract; see "Verification" for what has and has not been exercised):

- **77 algorithms** in 12 categories: Arrays (6), Two Pointers (7), Sliding Window (4), Linked Lists (8), Searching (4), Sorting (8), Stacks and Queues (7), Hashing (5), Trees (9), Recursion (5), Dynamic Programming (6), Graphs (8). Each has an executor, a validated trace, and verified Java, Python, C++ and C code with synchronized line highlighting.
- **Accounts**: register, login, logout, forgot/reset password (console mailer in dev), refresh-token rotation with a short grace window.
- **Learning state**: progress bar per category and overall, completed topics, bookmarks, dashboard, and a bookmarks page (sign in required).
- **Search**: header search box (`/` shortcut) and a `/search` page with ranking and one-typo tolerance.

## Verification

- `pnpm test:strict`: trace-schema, viz-engine, algorithms (real javac/python3/g++/gcc against shared vectors) and web tests.
- `apps/web/e2e`: Playwright checks against an in-memory **stub** of the API (`node e2e/stub-api.mjs`); see docs/DEVELOPMENT_GUIDE.md. The Spring Boot layer (controllers, JDBC stores) has **not** been compiled in the authoring environment because Maven Central was unreachable; the framework-free core logic and the SQL are tested separately. Run `mvn test` locally first.

## Quick start

```bash
corepack enable && pnpm install
pnpm dev                # web app at http://localhost:3000 (works without the backend)
pnpm test               # all TypeScript tests (+ real javac/python3/g++/gcc conformance when installed)
pnpm test:strict        # same, but a missing toolchain is a failure (CI)
pnpm typecheck && pnpm lint
docker compose up -d postgres     # database for the API; see docs/DEVELOPMENT_GUIDE.md
```

Requires Node >= 22.12 and pnpm 10. The API needs JDK 21 and Maven.

## Layout

| Path | What |
| --- | --- |
| `apps/web` | Next.js 16 app: design tokens, layout, visualization workspace |
| `apps/api` | Spring Boot modular monolith, Flyway migrations (20 tables) |
| `packages/trace-schema` | Versioned trace schema (Zod) + semantic validator |
| `packages/viz-engine` | Pure playback reducer (no React) |
| `packages/algorithms` | Executors, limits, content (code in 4 languages + harnesses + vectors) |
| `tools/content-compiler` | Builds line maps from `@a` markers |
| `infra/db` | Migration verification against a real PostgreSQL |

More: `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_GUIDE.md`, `docs/EXECUTION_TRACE_SCHEMA.md`, `docs/VISUALIZATION_ENGINE.md`, `docs/TESTING_STRATEGY.md`.

## Algorithms shipped (10)

| Wave | Algorithm | Structure |
|------|-----------|-----------|
| 0 | Linked List: Insert at Beginning | linked list |
| 1 | Linear Search, Binary Search, Bubble Sort | array |
| 2 | Stack: Push and Pop, Queue: Enqueue and Dequeue | stack, queue |
| 2 | Binary Tree: In-order Traversal (recursion + call stack) | tree |
| 3 | Selection Sort, Insertion Sort | array |
| 3 | Linked List: Insert at End | linked list |

Each one ships verified Java, Python, C++ and C code. `pnpm test` compiles and runs all four languages against shared vectors; set `REQUIRE_TOOLCHAINS=1` to make a missing compiler a failure.
