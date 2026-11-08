import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { fmt, parseTree, TreeTrace, type TreeValuesInput } from "./tree-common";

export const ID = "bst-insert";
export interface BstInsertInput extends TreeValuesInput { readonly value: number }
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<BstInsertInput> {
  return parseTree(raw, limits, { maxLength: (l) => l.maxArrayLength - 1, fields: [{ name: "value", label: "Value to insert" }] }) as InputResult<BstInsertInput>;
}

function inorder(T: TreeTrace, id: string | null, out: number[]): number[] {
  if (id === null) return out;
  inorder(T, T.node(id).left, out);
  out.push(T.node(id).value);
  inorder(T, T.node(id).right, out);
  return out;
}

export function run(input: BstInsertInput, limits: LimitProfile): ExecutionTrace {
  const { value } = input;
  const T = new TreeTrace(ID, { values: [...input.values], value }, input.values, limits);
  T.step({ type: "init" }, "entry", T.nodes.length === 0
    ? `Insert ${value} into an empty binary search tree.`
    : `Insert ${value} into the binary search tree built from ${fmt(input.values)}. Walk down, going left for smaller values and right otherwise, until there is a free spot.`, { value });
  const created = T.create(value);
  T.step({ type: "init" }, "create-node", `Create a new node holding ${value}. It is not linked into the tree yet.`, { value });
  if (T.root === null) {
    T.attach(null, "left", created);
    T.step({ type: "init" }, "check-empty", `The tree is empty, so ${value} becomes the root.`, { value }, [{ id: created.id, role: "created", label: "new" }], [created.id]);
  } else {
    T.step({ type: "init" }, "check-empty", "The tree is not empty, so we must find where the new node belongs.", { value });
    T.current = T.root;
    for (;;) {
      const cur: string = T.current!;
      const v: number = T.value(cur)!;
      const left: boolean = value < v;
      T.visit(cur, "compare", (out) => `Compare ${value} with ${v}: ${left ? "smaller, so it belongs on the left" : "not smaller, so it belongs on the right"}. Path so far: ${fmt(out)}.`, { value, current: v });
      const next: string | null = left ? T.node(cur).left : T.node(cur).right;
      if (next === null) {
        T.attach(cur, left ? "left" : "right", created);
        T.step({ type: "init" }, left ? "attach-left" : "attach-right", `${v} has no ${left ? "left" : "right"} child, so attach the new node there.`, { value, current: v }, [{ id: created.id, role: "created", label: "new" }], [created.id]);
        break;
      }
      T.current = next;
      T.step({ type: "init" }, left ? "go-left" : "go-right", `${left ? "Left" : "Right"} child of ${v} is ${T.value(next)}. Move there.`, { value, current: T.value(next) });
    }
  }
  const result = inorder(T, T.root, []);
  T.current = null;
  T.output.length = 0;
  T.output.push(...result);
  T.step({ type: "done" }, "finish", `Done. ${value} is in the tree. Its in-order listing is ${fmt(result)}, still sorted.`, { value }, [{ id: created.id, role: "found", label: "new" }]);
  return T.finish(result, "O(h)", "O(1)");
}
export const bstInsert: AlgorithmDefinition<BstInsertInput> = { id: ID, parseInput, run };
