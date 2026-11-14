# Execution trace schema (v1.0.0)

Source of truth: `packages/trace-schema/src`. A trace is `{schemaVersion, algorithmId, stateKind, input, steps[], summary}`.

Each step holds a **full state snapshot** (so previous/next/jump are index changes) plus `event`, `source` (`{kind:'anchor', id}` in MVP 1), `explanation`, `variables[{name,value,changed}]`, `changed[]`, `highlights[{target,role,label?}]`, optional `motion`.

Validation has two layers: Zod structure (strict objects, unknown fields rejected) and semantic checks (supported version, step limit, `index === position`, unique variable names, valid node references, no cycles, valid event references). Versioning: same major and minor <= current is supported; a new event type or state kind is a minor change.

The trace never contains a language: the same trace drives all four code panels.

## Schema 1.1.0 additions (Waves 1-2)

New state kinds (minor change): `array` (values + named index pointers), `stack` and `queue` (`items`, bottom/front first), and `tree` (nodes with left/right ids, `root`, `current`, `callStack` of node ids or null, and the `output` so far). New events: `call` and `return` (argument node id, or null for an empty subtree). Stack and queue traces may only use their own add/remove events plus `peek`, `underflow`, `overflow`, `init`, `done`; tree traces may only use `init`, `call`, `return`, `visit`, `done`. Semantic checks: a push/enqueue points at the new last item, a peek at the item that leaves next, a pop/dequeue at the vacated slot, a call is on top of the call stack, a visit appends the node's value to the output, and every tree node is reachable from the root exactly once.

## Schema 1.2.0 addition (graphs)
New state kind (minor change, so 1.1 traces stay valid): `graph`. Fields: `directed`; `nodes` (`id`, `value` = vertex number); `edges` (`from`, `to`, `weight` or null); `current` (vertex being processed); `activeEdge` (the edge being examined, or null); `frontier` + `frontierName` (the queue, stack or call stack in use); `visited`; `marks` + `markName` (one number per vertex, such as a distance, parent, component or in-degree, null when unset); `output` (the result so far).
Graph traces may use `init`, `compare`, `assign`, `visit`, `enqueue`, `dequeue`, `push`, `pop`, `call`, `return`, `found`, `notFound`, `done`, and may reference vertices only by node id. Semantic checks: node ids are unique; every edge, pointer, frontier entry, visited entry, mark and reference points at an existing vertex; no self-loops or duplicate edges (an undirected edge counts in both directions); the active edge must be an edge of the graph.


## Schema 1.3.0 addition (text)

`ArrayState` gains an optional boolean `chars`. When true, `values` are character codes and the renderer draws each cell as the character (`"a"`), and the text description reads `["a", "b"]`. Traces without the field, including every earlier trace, are unchanged and still valid. String algorithms use it, so the existing array renderer, pointers and highlights work for text without a new state kind.
