import { nodeRef, type ExecutionTrace, type Highlight, type HighlightRole, type TraceEvent, type TrieState } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder, type Scalar } from "../trace-builder";
import { parseText, type Txt } from "./interview-strings";

/**
 * Milestone 14: the suffix trie. Every suffix of the text is inserted letter by letter into a trie
 * (schema 1.5 `trie` state). The picture is a tree whose nodes have up to 26 labelled children.
 */

export const DISTINCT_ID = "trie-distinct-substrings";
export const REPEATED_ID = "longest-repeated-substring";

export interface Node { id: string; label: string; count: number; children: string[]; end?: boolean }
type Mark = { id: string; role: HighlightRole; label?: string };

const parseT = (raw: unknown, limits: LimitProfile) => parseText(raw, limits) as InputResult<Txt>;
const q = (s: string): string => `"${s}"`;

export class Trie {
  readonly nodes: Node[] = [{ id: "n0", label: "", count: 0, children: [] }];
  /** Root-to-current walk of the suffix being inserted. */
  path: string[] = ["n0"];
  word = "";
  position: number | null = null;
  readonly b: TraceBuilder<"trie">;
  private readonly byId = new Map<string, Node>([["n0", this.nodes[0]!]]);

  /** Word tries mark the end of each stored word, so every node then carries an `end` flag. */
  constructor(id: string, input: Record<string, unknown>, limits: LimitProfile, private readonly marksEnds = false) {
    this.b = new TraceBuilder({ algorithmId: id, stateKind: "trie", input, maxSteps: limits.maxSteps });
    if (marksEnds) this.nodes[0]!.end = false;
  }
  get current(): string { return this.path[this.path.length - 1]!; }
  node(id: string): Node { return this.byId.get(id)!; }
  childFor(id: string, ch: string): Node | undefined {
    return this.node(id).children.map((c) => this.node(c)).find((c) => c.label === ch);
  }
  create(parent: string, ch: string): Node {
    const n: Node = { id: `n${this.nodes.length}`, label: ch, count: 0, children: [], ...(this.marksEnds ? { end: false } : {}) };
    this.nodes.push(n);
    this.byId.set(n.id, n);
    const p = this.node(parent);
    p.children.push(n.id);
    p.children.sort((a, b) => (this.node(a).label < this.node(b).label ? -1 : 1));
    return n;
  }
  state(): TrieState {
    return { kind: "trie", nodes: this.nodes.map((n) => ({ ...n, children: [...n.children] })), root: "n0", current: this.current, word: this.word, position: this.position };
  }
  marks(extra: readonly Mark[] = []): Highlight[] {
    const roles = new Map<string, Highlight>();
    const put = (id: string, role: HighlightRole, label?: string) => roles.set(id, { target: nodeRef(id), role, ...(label ? { label } : {}) });
    for (const id of this.path) put(id, "visited");
    put(this.current, "active", "here");
    for (const e of extra) put(e.id, e.role, e.label);
    return [...roles.values()];
  }
  step(event: TraceEvent, anchor: string, explanation: string, variables: Record<string, Scalar>, extra: readonly Mark[] = [], changed: readonly string[] = []): void {
    this.b.step({ event, anchor, explanation, variables, state: this.state(), highlights: this.marks(extra), changed: changed.map((id) => nodeRef(id)) });
  }
}

/**
 * Shared walk. With `countVisits` the nodes carry how many suffixes pass through them and the
 * deepest node reached by two or more suffixes is the answer (longest repeated substring);
 * otherwise the answer is the number of nodes created (distinct substrings).
 */
function run(id: string, s: string, limits: LimitProfile, countVisits: boolean): ExecutionTrace {
  const T = new Trie(id, { s }, limits);
  const n = s.length;
  let created = 0;
  let best = 0;
  let bestNode: string | null = null;
  const vars = (extra: Record<string, Scalar>): Record<string, Scalar> => (countVisits ? { ...extra, best } : { ...extra, count: created });
  T.step({ type: "init" }, "entry", countVisits
    ? `Find the longest substring of ${q(s)} that appears at least twice. Insert every suffix into a trie and count how many suffixes pass through each node: a node reached twice is a repeated substring.`
    : `Count the distinct substrings of ${q(s)}. Insert every suffix into a trie: every substring is a path from the root, and every node is created exactly once, so the number of nodes is the answer.`, vars({}));
  T.step({ type: "init" }, "init", "Start with a trie that has only the empty root.", vars({}));
  for (let i = 0; i < n; i++) {
    T.path = ["n0"];
    T.word = s.slice(i);
    T.position = 0;
    T.step({ type: "init" }, "suffix", `Insert the suffix ${q(T.word)} (it starts at index ${i}). Begin at the root.`, vars({ i }));
    for (let j = 0; j < T.word.length; j++) {
      const ch = T.word[j]!;
      T.position = j;
      const parent = T.current;
      const existing = T.childFor(parent, ch);
      T.step(existing ? { type: "found", element: nodeRef(existing.id) } : { type: "notFound" }, "check", existing ? `The current node already has a child for "${ch}".` : `The current node has no child for "${ch}" yet.`, vars({ i, j, ch }), existing ? [{ id: existing.id, role: "found", label: ch }] : []);
      let next = existing;
      if (!next) {
        next = T.create(parent, ch);
        created++;
        T.step({ type: "insertNode", node: next.id }, "create", `Create a new node for "${ch}". That is a substring never seen before, so the count is now ${created}.`, vars({ i, j, ch }), [{ id: next.id, role: "found", label: "new" }], [next.id, parent]);
      }
      T.path.push(next.id);
      T.position = j + 1;
      if (countVisits) next.count++;
      const reached = T.path.length - 1;
      T.step({ type: "visit", element: nodeRef(next.id) }, "descend", countVisits ? `Move into the "${ch}" child and add one to its count: ${next.count} suffix${next.count === 1 ? "" : "es"} now pass through ${q(T.word.slice(0, j + 1))}.` : `Move into the "${ch}" child.`, vars({ i, j, ch }), [], countVisits ? [next.id] : []);
      if (countVisits && next.count >= 2 && reached > best) {
        best = reached;
        bestNode = next.id;
        T.step({ type: "found", element: nodeRef(next.id) }, "best", `Two suffixes share this path, so it is a repeated substring of length ${reached}. It is the longest so far.`, vars({ i, j, ch }), [{ id: next.id, role: "found", label: `len ${reached}` }], [next.id]);
      }
    }
    T.position = null;
  }
  T.path = ["n0"];
  T.word = "";
  T.position = null;
  const result = countVisits ? best : created;
  T.step({ type: "done" }, "finish", countVisits
    ? (best === 0 ? "Done. No letter group appears twice, so the answer is 0." : `Done. The deepest node reached by two or more suffixes is at depth ${best}, so the longest repeated substring has length ${best}.`)
    : `Done. The trie has ${created} node${created === 1 ? "" : "s"} besides the root, so ${q(s)} has ${created} distinct substring${created === 1 ? "" : "s"}.`, vars({ result }), bestNode ? [{ id: bestNode, role: "found", label: `len ${best}` }] : []);
  return T.b.build({ time: "O(n²)", space: "O(n²)", result });
}

export const runDistinct = ({ s }: Txt, limits: LimitProfile): ExecutionTrace => run(DISTINCT_ID, s, limits, false);
export const runRepeated = ({ s }: Txt, limits: LimitProfile): ExecutionTrace => run(REPEATED_ID, s, limits, true);

export const trieDistinctSubstrings: AlgorithmDefinition<Txt> = { id: DISTINCT_ID, parseInput: parseT, run: runDistinct };
export const longestRepeatedSubstring: AlgorithmDefinition<Txt> = { id: REPEATED_ID, parseInput: parseT, run: runRepeated };
