# Visualization engine

`executor (pure TS) -> TraceBuilder -> validateTrace -> playback reducer -> renderer + CodeView + panels`.

- **Playback** (`packages/viz-engine`): a pure reducer with actions LOAD, PLAY, PAUSE, TOGGLE, NEXT, PREV, JUMP, RESET, REPLAY, SET_SPEED, TICK. Timers live in a React effect and carry the epoch they were scheduled in; any action that should cancel a pending tick bumps the epoch, so stale ticks are ignored. Randomized action sequences are tested for invariants.
- **Renderer**: `layoutLinkedList` is pure geometry (reachable nodes in the main row, detached nodes in a row above). Nodes and edges are keyed by id so CSS transitions animate moves; `prefers-reduced-motion` disables them. State is also exposed as text (SVG `aria-label` and a visible line).
- **Code panel**: generated line maps resolve the step's anchor to line ranges per language; switching language keeps the step.
- **URL state**: `lang`, `step` (1-based), `speed`, input values, `limits`; defaults omitted; everything parsed defensively.
