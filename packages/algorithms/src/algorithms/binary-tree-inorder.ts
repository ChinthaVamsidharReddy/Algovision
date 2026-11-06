import { nodeRef, type ExecutionTrace, type Highlight, type TreeState } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { fmt, parseArrayInput } from "./array-common";

export const ID = "binary-tree-inorder";

export interface TreeInput {
  readonly values: readonly number[];
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<TreeInput> {
  return parseArrayInput(raw, limits, { target: false, sorted: false, noun: "tree" }) as InputResult<TreeInput>;
}

interface MutableNode {
  id: string;
  value: number;
  left: string | null;
  right: string | null;
}

/** Binary search tree built by inserting values in order; a value that is not smaller goes right. */
export function buildTree(values: readonly number[]): { nodes: MutableNode[]; root: string | null } {
  const nodes: MutableNode[] = [];
  let root: string | null = null;
  for (const value of values) {
    const node: MutableNode = { id: `t${nodes.length + 1}`, value, left: null, right: null };
    nodes.push(node);
    if (root === null) {
      root = node.id;
      continue;
    }
    let cursor = nodes.find((n) => n.id === root)!;
    for (;;) {
      const side = value < cursor.value ? "left" : "right";
      const next = cursor[side];
      if (next === null) {
        cursor[side] = node.id;
        break;
      }
      cursor = nodes.find((n) => n.id === next)!;
    }
  }
  return { nodes, root };
}

export function run(input: TreeInput, limits: LimitProfile): ExecutionTrace {
  const { nodes, root } = buildTree(input.values);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const callStack: (string | null)[] = [];
  const output: number[] = [];
  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "tree",
    input: { values: [...input.values] },
    maxSteps: limits.maxSteps,
  });

  const current = (): string | null => (callStack.length > 0 ? callStack[callStack.length - 1]! : null);
  const state = (): TreeState => ({
    kind: "tree",
    nodes: nodes.map((n) => ({ ...n })),
    root,
    current: current(),
    callStack: [...callStack],
    output: [...output],
  });
  const valueOf = (id: string | null): number | null => (id === null ? null : byId.get(id)!.value);
  const marks = (visitedNow?: string): Highlight[] => {
    const out: Highlight[] = [];
    const active = current();
    const waiting = new Set(callStack.filter((id): id is string => id !== null));
    for (const n of nodes) {
      if (n.id === visitedNow) out.push({ target: nodeRef(n.id), role: "found", label: "visit" });
      else if (n.id === active) out.push({ target: nodeRef(n.id), role: "active", label: "current" });
      else if (waiting.has(n.id)) out.push({ target: nodeRef(n.id), role: "pointer" });
    }
    return out;
  };
  const visitedIds: string[] = [];
  const withVisited = (list: Highlight[]): Highlight[] => {
    const taken = new Set(list.map((h) => (h.target.kind === "node" ? h.target.id : "")));
    return [...list, ...visitedIds.filter((id) => !taken.has(id)).map((id): Highlight => ({ target: nodeRef(id), role: "visited" }))];
  };
  const vars = () => ({ node: valueOf(current()), depth: callStack.length });

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation:
      nodes.length === 0
        ? "The tree is empty. In-order traversal visits the left subtree, then the node, then the right subtree, using recursion."
        : `The values ${fmt(input.values)} were inserted into a binary search tree (smaller values go left, others go right). In-order traversal visits the left subtree, then the node, then the right subtree, using recursion.`,
    variables: { node: null, depth: 0 },
    state: state(),
    highlights: [],
  });

  const walk = (id: string | null, anchor: "entry" | "go-left" | "go-right", side: string): void => {
    callStack.push(id);
    const v = valueOf(id);
    builder.step({
      event: { type: "call", node: id },
      anchor,
      explanation:
        anchor === "entry"
          ? id === null
            ? "Call visit on the root. The tree is empty, so the root is null."
            : `Call visit on the root, ${v}.`
          : id === null
            ? `Call visit on the ${side} child of ${valueOf(callStack[callStack.length - 2]!)}. There is none (null).`
            : `Call visit on the ${side} child of ${valueOf(callStack[callStack.length - 2]!)}, which is ${v}.`,
      variables: { node: v, depth: callStack.length },
      state: state(),
      highlights: withVisited(marks()),
    });

    if (id === null) {
      callStack.pop();
      builder.step({
        event: { type: "return", node: null },
        anchor: "base-case",
        explanation: "The node is null, so there is nothing to visit. Return to the caller.",
        variables: vars(),
        state: state(),
        highlights: withVisited(marks()),
      });
      return;
    }

    const node = byId.get(id)!;
    walk(node.left, "go-left", "left");

    output.push(node.value);
    visitedIds.push(id);
    builder.step({
      event: { type: "visit", element: nodeRef(id) },
      anchor: "visit",
      explanation: `The left subtree is done. Visit ${node.value}: add it to the output, which is now ${fmt(output)}.`,
      variables: { node: node.value, depth: callStack.length },
      state: state(),
      changed: [nodeRef(id)],
      highlights: withVisited(marks(id)),
    });

    walk(node.right, "go-right", "right");

    callStack.pop();
    const last = callStack.length === 0;
    builder.step({
      event: { type: "return", node: id },
      anchor: "finish",
      explanation: last
        ? `Both subtrees of ${node.value} are done, and this was the outermost call. The traversal is complete: ${fmt(output)}.`
        : `Both subtrees of ${node.value} are done. Return to the caller.`,
      variables: vars(),
      state: state(),
      highlights: withVisited(marks()),
    });
  };

  walk(root, "entry", "root");
  return builder.build({ time: "O(n)", space: "O(h)", result: [...output] });
}

export const binaryTreeInorder: AlgorithmDefinition<TreeInput> = { id: ID, parseInput, run };
