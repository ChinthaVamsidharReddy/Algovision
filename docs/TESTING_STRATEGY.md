# Testing strategy

Per-algorithm contract (all automated): trace passes schema + semantic validation; final state equals the reference; structural invariants; every trace anchor exists in all four line maps; no dead anchors; displayed code compiles and reproduces every vector in real Java, Python, C++ and C (warnings are errors); a mutation (e.g. wrong `next`) is caught.

Other layers: playback reducer unit + randomized tests; web integration (RTL + axe-core, keyboard, URL state, input validation, limits); design-token WCAG contrast; API client retry/backoff; real-browser smoke (Chromium, light/dark, reduced motion, 375px, 6x CPU throttle); Flyway migrations on real PostgreSQL 16 with constraint checks.

## Honest gaps (milestone 1)
- Spring Boot code: only syntax-checked, and `AppProperties` logic executed on a JVM. Unit tests and `MigrationIT` are written but have not run (no Maven Central / Docker here); CI runs them.
- Docker images and compose stack were not built or started.
- Performance: throttled Chromium only; no real-device pass yet.
- Contrast is checked from tokens, not rendered pixels.
