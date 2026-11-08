import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { runTraversal } from "./binary-tree-traversals";
import { parseTree, type TreeValuesInput } from "./tree-common";

export const ID = "binary-tree-preorder";

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<TreeValuesInput> {
  return parseTree(raw, limits) as InputResult<TreeValuesInput>;
}
export function run(input: TreeValuesInput, limits: LimitProfile): ExecutionTrace {
  return runTraversal(ID, "pre", input, limits);
}
export const binaryTreePreorder: AlgorithmDefinition<TreeValuesInput> = { id: ID, parseInput, run };
