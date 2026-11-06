# Development guide

## Add an algorithm
1. `packages/algorithms/content/<id>/`: `algorithm.json`, `vectors.json`, `solution.{java,py,cpp,c}` with `@a <anchor>` markers (`//` or `#` as the language's comment), and `harness/` drivers (`Main.java`, `main.py`, `main.cpp`, `main.c`) that read the shared vector format from stdin.
2. Executor in `src/algorithms/<id>.ts` using `TraceBuilder`; register it in `src/registry.ts`.
3. `pnpm test`. Completeness, line-sync, executor and four-language conformance tests pick it up automatically.
4. New data structure? Add its state schema in `trace-schema/src/state.ts`, its trace schema in `trace.ts`, and a renderer in `apps/web`.

## Anchors
Every declared anchor must appear in all four files, no undeclared anchors may appear, and every declared anchor must be used by some vector's trace. Consecutive lines with the same anchor form one range.

## Database
`docker compose up -d postgres`, then `cd apps/api && mvn spring-boot:run`. Flyway applies `src/main/resources/db/migration`. Without Docker/Maven: `infra/db/verify-migrations.sh` applies the migrations to a throwaway local PostgreSQL 16 and runs `infra/db/verify.sql`.

## Limits and low-end devices
`NEXT_PUBLIC_VIZ_LIMIT_PROFILE=lite` (or `?limits=lite`) tightens input and trace limits. Profiles live in `packages/algorithms/src/limits.ts`.

## Browser smoke test
`pnpm --filter @algovision/web build`, start the server, then `node apps/web/e2e/smoke.mjs http://localhost:3000 <outDir>` (needs Playwright + Chromium).

## Authentication (API)
Set `AUTH_TOKEN_SECRET` (32+ random bytes, `openssl rand -base64 48`) before starting the API. Maven does not read `.env`; for local work run `cd apps/api && mvn spring-boot:run -Dspring-boot.run.profiles=dev`, which supplies a public dev-only secret and non-Secure cookies (`application-dev.yml`; never use it in production). Endpoints: `POST /api/v1/auth/register|login|refresh|logout`, `GET /api/v1/auth/me` (Bearer token). `infra/db/verify-identity.sh` runs the exact identity SQL against a throwaway PostgreSQL 16, including a concurrent-rotation race.

## Catalog and learning API
After adding or editing an algorithm run `pnpm build:catalog` (it rewrites `apps/api/src/main/resources/db/migration/R__catalog_sync.sql`; `pnpm check:content` fails if it is stale). Public: `GET /api/v1/categories`, `GET /api/v1/algorithms[?category=slug]`, `GET /api/v1/algorithms/{slug}` (ETag = content hash). Bearer required: `GET /api/v1/me/progress|bookmarks|preferences`, `PUT /api/v1/me/preferences`, `PUT|DELETE /api/v1/me/bookmarks/{slug}`, `POST /api/v1/algorithms/{slug}/view|complete` (optional body `{"language":"java"}`). `infra/db/verify-catalog.sh` runs the exact SQL against a throwaway PostgreSQL 16 (48 checks).

## Browser E2E with the stub API (no backend needed)
`apps/web/e2e/stub-api.mjs` is an in-memory implementation of the API contract (Origin/client-header check, refresh rotation with grace, password reset that prints the link to its log, progress, bookmarks). It is a test double, not the real backend.
```bash
node apps/web/e2e/stub-api.mjs > /tmp/stub.log &                       # port 8099
API_INTERNAL_URL=http://127.0.0.1:8099 pnpm --filter @algovision/web build
pnpm --filter @algovision/web start -p 3100 &
node apps/web/e2e/auth-flow.mjs http://localhost:3100 /tmp/stub.log /tmp/e2e-out   # 43 checks
node apps/web/e2e/smoke.mjs http://localhost:3100 /tmp/e2e-smoke                   # 90 checks
```

## Adding an algorithm
Add `packages/algorithms/content/<id>/` (algorithm.json, vectors.json, solution.{java,py,cpp,c} with `@a` anchors, harness/), an executor in `src/algorithms/`, register it in `src/registry.ts` and `src/index.ts`, run `pnpm build:content && pnpm build:catalog`, then `REQUIRE_TOOLCHAINS=1 pnpm --filter @algovision/algorithms test`. `src/algorithms/array-input.ts` provides the shared input validation (extra integer fields, sortedness, ranges).
