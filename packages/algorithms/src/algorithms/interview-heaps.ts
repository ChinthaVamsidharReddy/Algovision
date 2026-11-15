import { type ExecutionTrace, type HighlightRole } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { LimitProfile } from "../limits";
import { parseArrayWithFields } from "./array-input";
import { fmt, TreeTrace, type MutableNode } from "./tree-common";

/** Milestone 13: min-heaps drawn as a complete binary tree (position i is node `t{i+1}`) and an AVL tree, all on the tree state. */
interface ValuesIn { readonly values: readonly number[] }
interface KthIn extends ValuesIn { readonly k: number }
type Mark = { id: string; role: HighlightRole; label?: string };
const parseValues = (raw: unknown, limits: LimitProfile) => parseArrayWithFields(raw, limits, { noun: "heap" }) as ReturnType<AlgorithmDefinition<ValuesIn>["parseInput"]>;

/** The heap array and its tree. Position i is the node with id `t{i+1}`; its parent is node (i - 1) >> 1. */
class Heap {
  readonly a: number[] = [];
  constructor(readonly T: TreeTrace) {}
  id(i: number): string { return `t${i + 1}`; }
  /** Adds a value at the next free position and links it under its parent. */
  grow(value: number): string {
    const i = this.a.length;
    this.a.push(value);
    const n: MutableNode = this.T.create(value);
    this.T.attach(i === 0 ? null : this.id((i - 1) >> 1), i % 2 === 1 ? "left" : "right", n);
    return n.id;
  }
  /** Writes the array back into the node values. */
  sync(): void { this.a.forEach((v, i) => { this.T.node(this.id(i)).value = v; }); }
  swap(i: number, j: number): void {
    [this.a[i], this.a[j]] = [this.a[j]!, this.a[i]!];
    this.sync();
  }
}
const at = (h: Heap, ...pairs: [number, HighlightRole, string?][]): Mark[] => pairs.map(([i, role, label]) => ({ id: h.id(i), role, ...(label ? { label } : {}) }));

// ---------------------------------------------------------------- build a min-heap by inserting one value at a time
export const BUILD_ID = "min-heap-build-insert";
export function runBuild({ values }: ValuesIn, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new TreeTrace(BUILD_ID, { values: [...values] }, [], limits);
  const h = new Heap(T);
  if (n > 0) h.grow(values[0]!);
  T.step({ type: "init" }, "entry", n === 0 ? "The array is empty, so the heap is empty too." : `Build a min-heap from ${fmt(values)} by inserting the values one at a time. A min-heap keeps every parent no bigger than its children. The first value, ${values[0]}, is a heap of one on its own.`, { n });
  for (let i = 1; i < n; i++) {
    const v = values[i]!;
    h.grow(v);
    let child = i;
    T.step({ type: "init" }, "insert", `Insert ${v}: put it in the next free spot at the bottom of the tree (index ${i}), then move it up while it is smaller than its parent.`, { i, child }, at(h, [i, "created", "new"]), [h.id(i)]);
    let reachedRoot = false;
    while (child > 0) {
      const parent = (child - 1) >> 1;
      T.step({ type: "init" }, "sift-up", `The parent of index ${child} is index ${parent}.`, { i, child, parent }, at(h, [child, "active", "child"], [parent, "compared", "parent"]));
      const stop = h.a[parent]! <= h.a[child]!;
      T.step({ type: "init" }, "compare", stop ? `Parent ${h.a[parent]} is not bigger than child ${h.a[child]}, so the heap rule holds. Stop.` : `Parent ${h.a[parent]} is bigger than child ${h.a[child]}, which breaks the heap rule. Swap them.`, { i, child, parent }, at(h, [child, "compared", "child"], [parent, "compared", "parent"]));
      if (stop) {
        T.step({ type: "init" }, "stop", `${h.a[child]} stays at index ${child}.`, { i, child, parent }, at(h, [child, "found"], [parent, "found"]));
        break;
      }
      h.swap(parent, child);
      T.step({ type: "init" }, "swap", `Swap: ${h.a[parent]} moves up to index ${parent} and ${h.a[child]} moves down to index ${child}.`, { i, child, parent }, at(h, [parent, "swapped"], [child, "swapped"]), [h.id(parent), h.id(child)]);
      child = parent;
      if (child === 0) reachedRoot = true;
    }
    if (reachedRoot) T.step({ type: "init" }, "sift-up", `${h.a[0]} reached the root (index 0), so it cannot move up any further.`, { i, child }, at(h, [0, "found", "root"]));
  }
  T.output.push(...h.a);
  T.step({ type: "done" }, "finish", n === 0 ? "Done. There is nothing to arrange." : `Done. The array is now a min-heap: ${fmt(h.a)}. Every parent is no bigger than its children, so the smallest value, ${h.a[0]}, is at the root.`, { n }, h.a.map((_, i) => ({ id: h.id(i), role: "found" as const })));
  return T.finish([...h.a], "O(n log n)", "O(1)");
}
export const minHeapBuildInsert: AlgorithmDefinition<ValuesIn> = { id: BUILD_ID, parseInput: parseValues, run: runBuild };

// ---------------------------------------------------------------- heapify (Floyd): sift down from the last parent
export const HEAPIFY_ID = "heapify-bottom-up";
export function runHeapify({ values }: ValuesIn, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new TreeTrace(HEAPIFY_ID, { values: [...values] }, [], limits);
  const h = new Heap(T);
  for (const v of values) h.grow(v);
  T.step({ type: "init" }, "entry", n === 0 ? "The array is empty, so there is nothing to arrange." : `Turn ${fmt(values)} into a min-heap in place. Read as a tree, the array is already complete but not ordered. Start at the last parent and sift each value down; the leaves are single-value heaps already.`, { n });
  for (let start = (n >> 1) - 1; start >= 0; start--) {
    let root = start;
    T.step({ type: "init" }, "start", `Sift down the value ${h.a[root]} at index ${root}.${start === (n >> 1) - 1 ? " This is the last value that has a child." : ""}`, { start, root }, at(h, [root, "active", "root"]));
    for (;;) {
      let smallest = root;
      const left = 2 * root + 1;
      const right = left + 1;
      T.step({ type: "init" }, "pick-smallest", `Assume the root, index ${root} (${h.a[root]}), is the smallest of its family. Its children are at ${left} and ${right}.`, { start, root, smallest, left, right }, at(h, [root, "active", "root"]));
      const leftWins = left < n && h.a[left]! < h.a[smallest]!;
      T.step({ type: "init" }, "compare-left", left >= n ? `There is no left child (index ${left} is outside the tree).` : leftWins ? `Left child ${h.a[left]} < ${h.a[smallest]}, so it becomes the smallest.` : `Left child ${h.a[left]} is not smaller than ${h.a[smallest]}.`, { start, root, smallest, left, right }, [...at(h, [root, "active", "root"]), ...(left < n ? at(h, [left, "compared", "left"]) : [])]);
      if (leftWins) smallest = left;
      const rightWins = right < n && h.a[right]! < h.a[smallest]!;
      T.step({ type: "init" }, "compare-right", right >= n ? `There is no right child (index ${right} is outside the tree).` : rightWins ? `Right child ${h.a[right]} < ${h.a[smallest]}, so it becomes the smallest.` : `Right child ${h.a[right]} is not smaller than ${h.a[smallest]}.`, { start, root, smallest, left, right }, [...at(h, [root, "active", "root"]), ...(right < n ? at(h, [right, "compared", "right"]) : [])]);
      if (rightWins) smallest = right;
      if (smallest === root) {
        T.step({ type: "init" }, "stop", `The root is already the smallest of its family, so the heap rule holds here. Stop.`, { start, root, smallest }, at(h, [root, "found", "root"]));
        break;
      }
      const from = root;
      h.swap(root, smallest);
      T.step({ type: "init" }, "swap", `Swap ${h.a[smallest]} with the smaller child: ${h.a[from]} moves up to index ${from} and ${h.a[smallest]} moves down to index ${smallest}.`, { start, root, smallest }, at(h, [from, "swapped"], [smallest, "swapped"]), [h.id(from), h.id(smallest)]);
      root = smallest;
    }
  }
  T.output.push(...h.a);
  T.step({ type: "done" }, "finish", n === 0 ? "Done." : `Done. The array is a min-heap: ${fmt(h.a)}. The smallest value, ${h.a[0]}, is at the root. Building this way takes O(n), faster than inserting one by one.`, { n }, h.a.map((_, i) => ({ id: h.id(i), role: "found" as const })));
  return T.finish([...h.a], "O(n)", "O(1)");
}
export const heapifyBottomUp: AlgorithmDefinition<ValuesIn> = { id: HEAPIFY_ID, parseInput: parseValues, run: runHeapify };

// ---------------------------------------------------------------- k-th largest with a min-heap of size k
export const KTH_ID = "kth-largest-element";
export const parseKth = (raw: unknown, limits: LimitProfile) =>
  parseArrayWithFields(raw, limits, { noun: "array", minLength: 1, fields: [{ name: "k", label: "k", min: () => 1, max: (v) => v.length, rangeMessage: (v) => `k must be between 1 and ${Math.max(v.length, 1)}.` }] }) as ReturnType<AlgorithmDefinition<KthIn>["parseInput"]>;
export function runKth({ values, k }: KthIn, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new TreeTrace(KTH_ID, { values: [...values], k }, [], limits);
  const h = new Heap(T);
  T.step({ type: "init" }, "entry", `Find the ${k}${ord(k)} largest value in ${fmt(values)}. Keep a min-heap of the ${k} largest values seen so far. Its root is the smallest of them, so a new value only matters if it beats the root.`, { k, n });
  for (let i = 0; i < n; i++) {
    const v = values[i]!;
    T.step({ type: "init" }, "next", `Take value ${i + 1} of ${n}: ${v}.`, { i, v, size: h.a.length, k });
    const room = h.a.length < k;
    T.step({ type: "init" }, "check-size", room ? `The heap holds ${h.a.length} of ${k} values, so there is room. ${v} goes in.` : `The heap already holds ${k} values, so ${v} must beat the smallest of them to get in.`, { i, v, size: h.a.length, k }, h.a.length ? at(h, [0, "compared", "root"]) : []);
    if (room) {
      h.grow(v);
      let child = h.a.length - 1;
      T.step({ type: "init" }, "push", `Put ${v} in the next free spot (index ${child}).`, { i, v, size: h.a.length, child }, at(h, [child, "created", "new"]), [h.id(child)]);
      while (child > 0) {
        const parent = (child - 1) >> 1;
        const stop = h.a[parent]! <= h.a[child]!;
        T.step({ type: "init" }, "sift-up", stop ? `Parent ${h.a[parent]} is not bigger than ${h.a[child]}. The heap rule holds. Stop.` : `Parent ${h.a[parent]} is bigger than ${h.a[child]}, so swap them.`, { i, v, child, parent }, at(h, [child, stop ? "found" : "compared", "child"], [parent, stop ? "found" : "compared", "parent"]));
        if (stop) break;
        h.swap(parent, child);
        T.step({ type: "init" }, "sift-up", `Swapped: ${h.a[parent]} is now at index ${parent}.`, { i, v, child, parent }, at(h, [parent, "swapped"], [child, "swapped"]), [h.id(parent), h.id(child)]);
        child = parent;
      }
    } else {
      const root = h.a[0]!;
      const beats = v > root;
      T.step({ type: "init" }, "compare-root", beats ? `${v} > ${root}, so ${v} belongs among the ${k} largest. The smallest kept value, ${root}, is pushed out.` : `${v} is not bigger than the smallest kept value ${root}, so it cannot be among the ${k} largest. Skip it.`, { i, v, root: root, size: k }, at(h, [0, beats ? "found" : "compared", "root"]));
      if (beats) {
        h.a[0] = v;
        h.sync();
        let r = 0;
        T.step({ type: "init" }, "replace", `Replace the root with ${v}, then sift it down to restore the heap rule.`, { i, v, root: r }, at(h, [0, "active", "root"]), [h.id(0)]);
        for (;;) {
          let smallest = r;
          const left = 2 * r + 1;
          const right = left + 1;
          if (left < k && h.a[left]! < h.a[smallest]!) smallest = left;
          if (right < k && h.a[right]! < h.a[smallest]!) smallest = right;
          const kids = [left, right].filter((x) => x < k);
          const family: [number, HighlightRole, string?][] = [[r, "active", "root"], ...kids.map((x): [number, HighlightRole, string?] => [x, "compared"])];
          T.step({ type: "init" }, "sift-down", smallest === r ? (kids.length === 0 ? `${h.a[r]} has no children, so it stays.` : `${h.a[r]} is not bigger than its ${kids.length === 1 ? "child" : "children"} ${kids.map((x) => h.a[x]).join(" and ")}. The heap rule holds. Stop.`) : `The smallest of ${h.a[r]}'s family is ${h.a[smallest]} at index ${smallest}. Swap them.`, { i, v, root: r, smallest }, at(h, ...family));
          if (smallest === r) break;
          const from = r;
          h.swap(r, smallest);
          T.step({ type: "init" }, "sift-down", `Swapped: ${h.a[from]} is now at index ${from} and ${h.a[smallest]} moved down to index ${smallest}.`, { i, v, root: from, smallest }, at(h, [from, "swapped"], [smallest, "swapped"]), [h.id(from), h.id(smallest)]);
          r = smallest;
        }
      }
    }
  }
  const result = h.a[0]!;
  T.step({ type: "done" }, "finish", `Done. The root of the heap, ${result}, is the smallest of the ${k} largest values, so it is the ${k}${ord(k)} largest overall.`, { k, result }, at(h, [0, "found", "answer"]));
  return T.finish(result, "O(n log k)", "O(k)");
}
const ord = (k: number): string => (k % 100 >= 11 && k % 100 <= 13 ? "th" : k % 10 === 1 ? "st" : k % 10 === 2 ? "nd" : k % 10 === 3 ? "rd" : "th");
export const kthLargestElement: AlgorithmDefinition<KthIn> = { id: KTH_ID, parseInput: parseKth, run: runKth };

// ---------------------------------------------------------------- AVL tree: insert with rotations, report the height
export const AVL_ID = "avl-tree-insert";
export function runAvl({ values }: ValuesIn, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new TreeTrace(AVL_ID, { values: [...values] }, [], limits);
  type Parent = { id: string | null; side: "left" | "right" };
  const val = (id: string): number => T.node(id).value;
  const height = (id: string | null): number => (id === null ? 0 : 1 + Math.max(height(T.node(id).left), height(T.node(id).right)));
  const link = (p: Parent, child: string): void => {
    if (p.id === null) T.root = child;
    else T.node(p.id)[p.side] = child;
  };
  const mark = (id: string, role: HighlightRole, label?: string): Mark => ({ id, role, ...(label ? { label } : {}) });
  const ret = (id: string, anchor: string, text: string, vars: Record<string, number | null> = {}): void => {
    T.callStack.pop();
    T.current = T.top();
    T.step({ type: "return", node: id }, anchor, text, { node: val(id), depth: T.callStack.length, ...vars }, [mark(id, "found")]);
  };
  const rotate = (dir: "left" | "right", id: string, p: Parent, why: string): string => {
    const y = T.node(id);
    const upId = (dir === "right" ? y.left : y.right)!;
    const x = T.node(upId);
    if (dir === "right") { y.left = x.right; x.right = id; } else { y.right = x.left; x.left = id; }
    link(p, upId);
    T.step({ type: "init" }, dir === "right" ? "rotate-right" : "rotate-left", `${why} Rotate ${dir} around ${y.value}: ${x.value} moves up and ${y.value} becomes its ${dir === "right" ? "right" : "left"} child.`, { node: y.value, up: x.value }, [mark(upId, "swapped", "up"), mark(id, "swapped", "down")], [upId, id]);
    return upId;
  };
  function ins(id: string | null, v: number, p: Parent): string {
    T.call(id, "insert", id === null ? `Insert ${v} into an empty spot.` : `Insert ${v} into the subtree rooted at ${val(id)}.`, { value: v });
    if (id === null) {
      const fresh = T.create(v);
      T.attach(p.id, p.side, fresh);
      T.step({ type: "init" }, "create", `This spot is empty, so create a node holding ${v} here.`, { value: v }, [mark(fresh.id, "created", "new")], [fresh.id]);
      ret(fresh.id, "create", `Return the new node to its parent.`, { value: v });
      return fresh.id;
    }
    const node = T.node(id);
    if (v === node.value) {
      T.step({ type: "init" }, "duplicate", `${v} is already in the tree. An AVL tree keeps each value once, so skip it.`, { value: v }, [mark(id, "found", "same")]);
      ret(id, "duplicate", `Nothing changes. Return.`, { value: v });
      return id;
    }
    const goLeft = v < node.value;
    T.step({ type: "init" }, "compare", `Compare ${v} with ${node.value}: ${goLeft ? "smaller, so it belongs in the left subtree" : "bigger, so it belongs in the right subtree"}.`, { value: v }, [mark(id, "compared", "here")]);
    T.step({ type: "init" }, goLeft ? "go-left" : "go-right", `Insert into the ${goLeft ? "left" : "right"} subtree of ${node.value}.`, { value: v }, [mark(id, "compared", "here")]);
    ins(goLeft ? node.left : node.right, v, { id, side: goLeft ? "left" : "right" });
    const lh = height(node.left);
    const rh = height(node.right);
    const balance = lh - rh;
    const bad = Math.abs(balance) > 1;
    T.step({ type: "init" }, "balance", `Back at ${node.value}: the left subtree has height ${lh}, the right ${rh}, so the balance is ${balance}. ${bad ? `That is outside -1 to 1: the tree is lopsided here and must be rotated.` : "That is within -1 to 1, so no rotation is needed."}`, { value: v, balance }, [mark(id, bad ? "swapped" : "compared", "balance")]);
    if (!bad) {
      ret(id, "balanced", `Return this node unchanged.`, { value: v, balance });
      return id;
    }
    let top: string;
    if (balance > 1 && v < val(node.left!)) top = rotate("right", id, p, `The new value went into the left child's left side (left-left).`);
    else if (balance < -1 && v > val(node.right!)) top = rotate("left", id, p, `The new value went into the right child's right side (right-right).`);
    else if (balance > 1) {
      rotate("left", node.left!, { id, side: "left" }, `The new value went into the left child's right side (left-right), so first straighten the left child.`);
      top = rotate("right", id, p, `Now the left side is straight (left-left).`);
    } else {
      rotate("right", node.right!, { id, side: "right" }, `The new value went into the right child's left side (right-left), so first straighten the right child.`);
      top = rotate("left", id, p, `Now the right side is straight (right-right).`);
    }
    ret(top, balance > 0 ? "rotate-right" : "rotate-left", `The subtree is balanced again, now rooted at ${val(top)}. Return it to the parent.`, { value: v, balance: height(T.node(top).left) - height(T.node(top).right) });
    return top;
  }
  T.step({ type: "init" }, "entry", n === 0 ? "No values, so the tree stays empty and its height is 0." : `Insert ${fmt(values)} into an AVL tree one at a time. After each insert, any node whose left and right subtrees differ in height by more than 1 is fixed with a rotation, so the tree never gets lopsided.`, { n });
  for (let i = 0; i < n; i++) {
    const v = values[i]!;
    T.step({ type: "init" }, "next", `Insert value ${i + 1} of ${n}: ${v}.`, { i, value: v });
    ins(T.root, v, { id: null, side: "left" });
  }
  T.current = null;
  const h = height(T.root);
  T.step({ type: "done" }, "finish", n === 0 ? "Done. The tree is empty, height 0." : `Done. The AVL tree has height ${h}. An unbalanced search tree built from the same values in this order could be as tall as ${new Set(values).size}.`, { n, height: h }, T.root ? [mark(T.root, "found", "root")] : []);
  return T.finish(h, "O(n log n)", "O(n)");
}
export const avlTreeInsert: AlgorithmDefinition<ValuesIn> = { id: AVL_ID, parseInput: parseValues, run: runAvl };
