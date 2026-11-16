import { nodeRef, type ExecutionTrace, type Highlight, type HighlightRole, type LinkedListState, type TraceEvent } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";
import type { OpSpec } from "../content-types";
import { decodeOps, type Op } from "../ops";
import { TraceBuilder, type Scalar } from "../trace-builder";
import { Trie } from "./interview-trie";

/**
 * Milestone 15: algorithms driven by an operation list (input kind `ops`): an LRU cache and a word trie.
 * The operation names and their order here must match `inputs[].ops` in each algorithm.json (a test checks it).
 */

export const LRU_OPS: readonly OpSpec[] = [{ name: "put", args: 2 }, { name: "get", args: 1 }];
export const TRIE_OPS: readonly OpSpec[] = [{ name: "insert", args: "word" }, { name: "search", args: "word" }, { name: "prefix", args: "word" }];
export const MAX_CAPACITY = 4;

type Rules = { maxOps: number; maxAbs: number };
const rules = (limits: LimitProfile): Rules => ({ maxOps: limits.maxArrayLength, maxAbs: limits.maxAbsValue });

function fieldErrors(...errors: FieldError[]): InputResult<never> {
  return { ok: false, errors };
}

// ------------------------------------------------------------------ LRU cache
export const LRU_ID = "lru-cache";
export interface LruIn { readonly ops: readonly number[]; readonly capacity: number }

export function parseLru(raw: unknown, limits: LimitProfile): InputResult<LruIn> {
  if (typeof raw !== "object" || raw === null) return fieldErrors({ field: "input", message: "The input must be an object." });
  const { ops, capacity, ...rest } = raw as Record<string, unknown>;
  if (Object.keys(rest).length > 0) return fieldErrors({ field: Object.keys(rest)[0]!, message: "Unknown input field." });
  const errors: FieldError[] = [];
  if (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) errors.push({ field: "capacity", message: `Capacity must be a whole number from 1 to ${MAX_CAPACITY}.` });
  const decoded = decodeOps(ops, LRU_OPS, rules(limits));
  if (!decoded.ok) errors.push({ field: "ops", message: decoded.message });
  if (errors.length > 0 || !decoded.ok) return { ok: false, errors };
  return { ok: true, value: { ops: ops as number[], capacity: capacity as number } };
}

/** The cache as the code keeps it: slot arrays threaded into a doubly linked list. The picture draws the `next` direction. */
class Lru {
  readonly keys: number[];
  readonly vals: number[];
  readonly prev: number[];
  readonly nxt: number[];
  head = -1;
  tail = -1;
  size = 0;
  /** A slot that holds an entry but is not linked into the list yet. */
  pending = -1;
  constructor(readonly capacity: number) {
    this.keys = Array<number>(capacity).fill(0);
    this.vals = Array<number>(capacity).fill(0);
    this.prev = Array<number>(capacity).fill(-1);
    this.nxt = Array<number>(capacity).fill(-1);
  }
  id = (s: number): string => `e${s}`;
  linked(): number[] {
    const out: number[] = [];
    for (let s = this.head; s !== -1; s = this.nxt[s]!) out.push(s);
    return out;
  }
  state(): LinkedListState {
    const slots = [...this.linked(), ...(this.pending !== -1 && !this.linked().includes(this.pending) ? [this.pending] : [])];
    return {
      kind: "linkedList",
      nodes: slots.map((s) => ({ id: this.id(s), value: this.vals[s]!, next: this.nxt[s] === -1 ? null : this.id(this.nxt[s]!) })),
      head: this.head === -1 ? null : this.id(this.head),
      pointers: { tail: this.tail === -1 ? null : this.id(this.tail) },
    };
  }
  /** Unlink `s` from wherever it is and make it the head (what the `front` lines of the code do). */
  toFront(s: number): void {
    if (this.prev[s] !== -1) this.nxt[this.prev[s]!] = this.nxt[s]!;
    if (this.nxt[s] !== -1) this.prev[this.nxt[s]!] = this.prev[s]!;
    if (this.tail === s) this.tail = this.prev[s]!;
    this.prev[s] = -1;
    this.nxt[s] = this.head;
    if (this.head !== -1) this.prev[this.head] = s;
    this.head = s;
    if (this.tail === -1) this.tail = s;
  }
  evict(): number {
    const s = this.tail;
    this.tail = this.prev[s]!;
    if (this.tail === -1) this.head = -1;
    else this.nxt[this.tail] = -1;
    this.prev[s] = -1;
    this.nxt[s] = -1;
    this.size--;
    return s;
  }
}

export function runLru({ ops: flat, capacity }: LruIn, limits: LimitProfile): ExecutionTrace {
  const ops = (decodeOps(flat, LRU_OPS, rules(limits)) as { ok: true; value: Op[] }).value;
  const b = new TraceBuilder<"linkedList">({ algorithmId: LRU_ID, stateKind: "linkedList", input: { ops: [...flat], capacity }, maxSteps: limits.maxSteps });
  const c = new Lru(capacity);
  const table = new Map<number, number>(); // key -> slot: the "hash table" (the code uses a direct-address array)
  let total = 0;
  const label = (): Highlight[] => c.state().nodes.map((n): Highlight => ({ target: nodeRef(n.id), role: "visited", label: `k=${c.keys[Number(n.id.slice(1))]}` }));
  const step = (event: TraceEvent, anchor: string, text: string, vars: Record<string, Scalar>, marks: readonly { s: number; role: HighlightRole }[] = []): void => {
    const strong = marks.map((m): Highlight => ({ target: nodeRef(c.id(m.s)), role: m.role }));
    b.step({ event, anchor, explanation: text, variables: { size: c.size, total, ...vars }, state: c.state(), highlights: [...strong, ...label()], changed: marks.map((m) => nodeRef(c.id(m.s))) });
  };
  const list = (): string => (c.head === -1 ? "empty" : c.linked().map((s) => `${c.keys[s]}`).join(", "));
  step({ type: "init" }, "entry", `Run ${ops.length} operation${ops.length === 1 ? "" : "s"} on an LRU cache that holds at most ${capacity} entr${capacity === 1 ? "y" : "ies"}. A table finds a key at once, and a linked list keeps the entries from most recently used (head) to least recently used (tail).`, {});
  step({ type: "init" }, "init", "The cache starts empty: the table has no keys and the list has no nodes. Each node is labelled with its key and shows its value.", {});
  ops.forEach((op, i) => {
    const key = op.args[0]!;
    const s0 = table.get(key) ?? -1;
    const text = op.name === "put" ? `put ${key} ${op.args[1]}` : `get ${key}`;
    step({ type: "init" }, "lookup", `Operation ${i + 1} of ${ops.length}: ${text}. Look the key up in the table: ${s0 === -1 ? "it is not there" : "it is in the cache"}.`, { op: i + 1, key }, s0 === -1 ? [] : [{ s: s0, role: "compared" }]);
    let s = s0;
    if (op.name === "get") {
      if (s === -1) {
        total -= 1;
        step({ type: "init" }, "miss", `Key ${key} is not cached, so get returns -1. The total is now ${total}.`, { op: i + 1, key });
      } else {
        total += c.vals[s]!;
        step({ type: "init" }, "hit", `Key ${key} is cached with value ${c.vals[s]}, so get returns it. The total is now ${total}.`, { op: i + 1, key, value: c.vals[s]! }, [{ s, role: "found" }]);
      }
    } else {
      const value = op.args[1]!;
      if (s !== -1) {
        c.vals[s] = value;
        step({ type: "init" }, "update", `Key ${key} is already cached, so only its value changes to ${value}.`, { op: i + 1, key, value }, [{ s, role: "found" }]);
      } else {
        if (c.size === capacity) {
          const victim = c.tail;
          const victimKey = c.keys[victim]!;
          table.delete(victimKey);
          s = c.evict();
          step({ type: "init" }, "evict", `The cache is full, so the least recently used entry (key ${victimKey}, the tail) is removed from the list and from the table.`, { op: i + 1, key, evicted: victimKey });
        } else s = c.size;
        c.size++;
        c.keys[s] = key;
        c.vals[s] = value;
        table.set(key, s);
        c.pending = s;
        step({ type: "init" }, "insert", `Store key ${key} with value ${value} in a free node and record it in the table. It is not linked into the list yet.`, { op: i + 1, key, value }, [{ s, role: "created" }]);
      }
    }
    if (s !== -1 && s !== c.head) {
      c.toFront(s);
      c.pending = -1;
      step({ type: "init" }, "front", `Move key ${key} to the head of the list: it is now the most recently used. Order from most to least recent: ${list()}.`, { op: i + 1, key }, [{ s, role: "found" }]);
    }
    c.pending = -1;
  });
  step({ type: "done" }, "finish", `Done. The values returned by get add up to ${total} (a miss counts as -1).`, { total });
  return b.build({ time: "O(1) per operation", space: "O(capacity)", result: total });
}
export const lruCache: AlgorithmDefinition<LruIn> = { id: LRU_ID, parseInput: parseLru, run: runLru };

// ------------------------------------------------------------------ word trie: insert, search, prefix
export const TRIE_OPS_ID = "trie-insert-search";
export interface TrieOpsIn { readonly ops: readonly number[] }

export function parseTrieOps(raw: unknown, limits: LimitProfile): InputResult<TrieOpsIn> {
  if (typeof raw !== "object" || raw === null) return fieldErrors({ field: "input", message: "The input must be an object." });
  const { ops, ...rest } = raw as Record<string, unknown>;
  if (Object.keys(rest).length > 0) return fieldErrors({ field: Object.keys(rest)[0]!, message: "Unknown input field." });
  const decoded = decodeOps(ops, TRIE_OPS, rules(limits));
  if (!decoded.ok) return fieldErrors({ field: "ops", message: decoded.message });
  return { ok: true, value: { ops: ops as number[] } };
}

export function runTrieOps({ ops: flat }: TrieOpsIn, limits: LimitProfile): ExecutionTrace {
  const ops = (decodeOps(flat, TRIE_OPS, rules(limits)) as { ok: true; value: Op[] }).value;
  const T = new Trie(TRIE_OPS_ID, { ops: [...flat] }, limits, true);
  let answers = 0;
  const vars = (extra: Record<string, Scalar> = {}): Record<string, Scalar> => ({ answers, ...extra });
  T.step({ type: "init" }, "entry", `Run ${ops.length} operation${ops.length === 1 ? "" : "s"} on a trie of words: insert adds a word, search asks whether the whole word was inserted, prefix asks whether any inserted word starts with it. Words with a double ring end a stored word.`, vars());
  T.step({ type: "init" }, "init", "Start with an empty trie that has only the root.", vars());
  ops.forEach((op, i) => {
    const w = op.word;
    T.path = ["n0"];
    T.word = w;
    T.position = 0;
    T.step({ type: "init" }, "op", `Operation ${i + 1} of ${ops.length}: ${op.name} "${w}". Start at the root.`, vars({ op: i + 1 }));
    let found = true;
    for (let j = 0; j < w.length; j++) {
      const ch = w[j]!;
      T.position = j;
      const existing = T.childFor(T.current, ch);
      T.step(existing ? { type: "found", element: nodeRef(existing.id) } : { type: "notFound" }, "check", existing ? `The current node already has a child for "${ch}".` : `The current node has no child for "${ch}".`, vars({ op: i + 1, j, ch }), existing ? [{ id: existing.id, role: "found", label: ch }] : []);
      let next = existing;
      if (!next) {
        if (op.name === "insert") {
          next = T.create(T.current, ch);
          T.step({ type: "insertNode", node: next.id }, "create", `Add a node for "${ch}" below the current node.`, vars({ op: i + 1, j, ch }), [{ id: next.id, role: "found", label: "new" }], [next.id, T.current]);
        } else {
          found = false;
          T.position = j;
          T.step({ type: "notFound" }, "miss", op.name === "search" ? `There is no path for "${w}", so search answers no.` : `Nothing stored starts with "${w}", so prefix answers no.`, vars({ op: i + 1, j, ch, result: 0 }));
          break;
        }
      }
      T.path.push(next.id);
      T.position = j + 1;
      T.step({ type: "visit", element: nodeRef(next.id) }, "descend", `Move into the "${ch}" child.`, vars({ op: i + 1, j, ch }));
    }
    if (op.name === "insert") {
      T.node(T.current).end = true;
      T.step({ type: "found", element: nodeRef(T.current) }, "mark", `Mark this node as the end of the word "${w}" (double ring).`, vars({ op: i + 1 }), [{ id: T.current, role: "found", label: "end" }], [T.current]);
    } else if (found) {
      const yes = op.name === "prefix" || T.node(T.current).end === true;
      if (yes) answers++;
      T.step({ type: "found", element: nodeRef(T.current) }, "answer", op.name === "prefix" ? `The whole prefix "${w}" is a path in the trie, so prefix answers yes.` : yes ? `The path for "${w}" ends at a word end, so search answers yes.` : `The path for "${w}" exists but no word ends here (it is only the start of longer words), so search answers no.`, vars({ op: i + 1, result: yes ? 1 : 0 }), [{ id: T.current, role: yes ? "found" : "compared", label: yes ? "yes" : "no" }]);
    }
  });
  T.path = ["n0"];
  T.word = "";
  T.position = null;
  T.step({ type: "done" }, "finish", `Done. ${answers} search or prefix question${answers === 1 ? " was" : "s were"} answered yes.`, vars({ result: answers }));
  return T.b.build({ time: "O(total letters)", space: "O(total letters)", result: answers });
}
export const trieInsertSearch: AlgorithmDefinition<TrieOpsIn> = { id: TRIE_OPS_ID, parseInput: parseTrieOps, run: runTrieOps };
