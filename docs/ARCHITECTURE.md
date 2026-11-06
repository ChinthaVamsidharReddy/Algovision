# Architecture (implementation notes)

The approved plan lives in the architecture document; this file records what milestone 1 actually built and the decisions made while building it.

## Approved decisions, as implemented
- Browser-side deterministic executors (`packages/algorithms`), no server execution in MVP 1.
- Anchors, not line numbers, in traces. Line maps are generated from `@a <id>` marker comments at build time.
- Short-lived access token + rotating httpOnly refresh cookie (auth itself is a later milestone). Already in place: exact Origin allowlist + custom client header on state-changing `/api/*` requests, no CORS, Next.js proxies `/api/*`.
- ROLE_INSTRUCTOR is not seeded and not assignable (two independent guards: no DB row, `RolePolicy`).
- Limits are configuration (`standard` / `lite`), selectable by env or `?limits=lite`.

## Decisions made during implementation (please review)
1. **Code panel is a lightweight custom `CodeView`, not Monaco.** It is read-only, tiny, accessible and fast on low-end devices. Monaco is only needed once users edit code (MVP 2).
2. **Spring Boot 3.5.16 is pinned but is out of open-source support (ended 2026-06-30).** A supported 4.x line is the likely target; it is a one-line change in `apps/api/pom.xml` plus starter/test-annotation migration. OPEN DECISION.
3. **JPA + Flyway** (`ddl-auto: validate`). No entities yet.
4. **`finish` anchor maps to an explicit `return`** in every language so each language has a real line for the final step.
5. **Trace state is JSON-cloned** per step (traces are JSON by contract).
6. The seeded linked-list algorithm row starts `DRAFT`; the content sync (decision 13) publishes it with real hashes.
7. **Identity core is framework-free** (`dev.algovision.identity.core`, JDK only). Spring only wires it (`AuthConfig`), stores SQL (`jdbc/`, `resources/sql/identity/*.sql`) and exposes HTTP (`web/`). This lets the security logic be tested without Spring or a database.
8. **Password hashing: PBKDF2-HMAC-SHA256 (JDK), 600,000 iterations**, stored as `pbkdf2-sha256$iterations$salt$hash` and upgraded at login when parameters rise. Chosen because BCrypt/Argon2 need a third-party library that could not be fetched here. It sits behind the `PasswordHasher` interface; switching to Argon2id later is one class. OPEN DECISION: confirm PBKDF2 or require Argon2id.
9. **Access token is an HMAC-signed `av1.` token, not a JWT** (15 min, payload `userId;exp;roles`). Only this API reads it, so there is no algorithm negotiation to attack. Roles are re-read from the database on each authenticated request, so a role change or disabled account takes effect immediately.
10. **Refresh token: 32 random bytes, only its SHA-256 is stored, rotated on every use, family revoked on reuse**, httpOnly + Secure + SameSite=Lax cookie scoped to `/api/v1/auth`. A token that was rotated less than `auth.refresh-grace` (10 s) ago may be presented again and simply yields another token in the same family, because a browser that reloads mid-refresh keeps the old cookie while the server has already rotated (found by the browser E2E test) and two tabs can refresh at the same instant. Outside the window a second use is treated as theft and revokes the family. Set the grace to 0 for strict rotation; the trade-off is that a stolen token replayed inside the window is also accepted.
11. **Login throttle is in memory (5 failures per email per 15 min)**, so it is per instance. Fine for one Render instance; move it to the database or a cache before running more than one. Registration reveals whether an email is taken (409); there is no per-IP limit yet.
12. `AUTH_TOKEN_SECRET` has no default: the API refuses to start without 32+ bytes.
13. **Content sync is a generated Flyway repeatable migration** (`R__catalog_sync.sql`, from `tools/content-compiler/catalog-sync.mjs`; `pnpm build:catalog`, checked by `pnpm check:content`). It upserts categories/topics/algorithms as PUBLISHED, stores one sha256 per language (over newline-normalised source) and appends an `algorithm_versions` row only when the combined hash changes. Category/topic grouping lives in the tool's `CATALOG` table (one topic per category for now). Chosen over a manual admin step so a deploy can never serve a catalog that disagrees with the shipped content.
14. **Lesson content stays in the web bundle; the API serves catalog structure and content hashes.** `GET /api/v1/algorithms/{slug}` returns the per-language hashes and uses the latest version hash as a strong ETag (304 on `If-None-Match`). The web app can compare hashes to detect a stale bundle. Catalog GETs are public; everything under `/me` and the view/complete endpoints needs a Bearer token.
15. **Learning state is idempotent by construction**: views upsert (never move `last_viewed_at` backwards, never reopen a completed algorithm), completion keeps the first `completed_at`, bookmarks use `ON CONFLICT DO NOTHING`, removing a missing bookmark succeeds. Audit rows (`learning_activity`) are best-effort and never fail the learner's action. Quiz events are not written yet.

## Not verified in this environment
Maven Central and the Docker daemon were unavailable, so the Spring Boot code (including the identity controller, JDBC stores and wiring) was never compiled against Spring, no `mvn` tests ran, and no image was built. What did run: the identity core and its tests on a plain JDK with a small JUnit stand-in, and the identity and catalog/learning SQL files against a real PostgreSQL 16 (`infra/db/verify-identity.sh`, `infra/db/verify-catalog.sh`). The catalog and learning controllers, JDBC stores and configs are equally uncompiled. See `docs/TESTING_STRATEGY.md`.

## Content waves 4-6 (this pass)
Nine algorithms added (Arrays: find-maximum, prefix-sum, insert-at-index, delete-at-index; Two Pointers: two-sum-sorted, reverse-in-place, remove-duplicates-sorted; Sliding Window: max-sum-subarray-k, smallest-subarray-sum). Decisions: (16) no trace-schema change; windows use the existing `window` highlight role and `left`/`right` array pointers. (17) Insert/delete model the array as a fixed buffer plus a count, as in Java/C/C++; insert shows one spare slot, delete shrinks in the final step. (18) The completeness contract requires an empty-array vector only where the algorithm accepts an empty array.
