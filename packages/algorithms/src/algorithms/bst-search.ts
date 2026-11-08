import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { fmt, parseTree, TreeTrace, type TreeValuesInput } from "./tree-common";

export const ID = "bst-search";
export interface BstSearchInput extends TreeValuesInput { readonly value: number }
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<BstSearchInput> {
  return parseTree(raw, limits, { fields: [{ name: "value", label: "Value to find" }] }) as InputResult<BstSearchInput>;
}

export function run(input: BstSearchInput, limits: LimitProfile): ExecutionTrace {
  const { value } = input;
  const T = new TreeTrace(ID, { values: [...input.values], value }, input.values, limits);
  T.step({ type: "init" }, "entry", T.nodes.length === 0
    ? `Search an empty tree for ${value}.`
    : `Search the binary search tree built from ${fmt(input.values)} for ${value}. At each node go left if the value is smaller, right if it is larger.`, { value });
  T.current = T.root;
  T.step({ type: "init" }, "init", T.root === null ? "current starts at the root, which is null." : `current starts at the root, ${T.value(T.root)}.`, { value, current: T.value(T.root) });
  let found = false;
  while (T.current !== null) {
    const cur = T.current;
    const v = T.value(cur)!;
    T.visit(cur, "loop", (out) => `Look at ${v}. Nodes checked so far: ${fmt(out)}.`, { value, current: v });
    if (value === v) {
      T.step({ type: "done" }, "found", `${value} equals ${v}. Found it!`, { value, current: v }, [{ id: cur, role: "found", label: "found" }]);
      found = true;
      break;
    }
    const left = value < v;
    T.current = left ? T.node(cur).left : T.node(cur).right;
    T.step({ type: "init" }, left ? "go-left" : "go-right",
      `${value} is ${left ? "smaller" : "larger"} than ${v}, so go ${left ? "left" : "right"}${T.current === null ? ". There is no child there." : ` to ${T.value(T.current)}.`}`,
      { value, current: T.value(T.current) }, [{ id: cur, role: "compared" }]);
  }
  if (!found) T.step({ type: "done" }, "not-found", `We fell off the tree, so ${value} is not in it.`, { value, current: null });
  return T.finish(found ? 1 : 0, "O(h)", "O(1)");
}
export const bstSearch: AlgorithmDefinition<BstSearchInput> = { id: ID, parseInput, run };
