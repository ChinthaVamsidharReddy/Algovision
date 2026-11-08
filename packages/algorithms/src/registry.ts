import { generatedContent } from "./generated/content";
import type { AlgorithmContent } from "./content-types";
import type { AlgorithmDefinition } from "./definition";
import type { InputResult } from "./input";
import type { LimitProfile } from "./limits";
import { TraceLimitError } from "./trace-builder";
import { linkedListInsertHead } from "./algorithms/linked-list-insert-head";
import { linearSearch } from "./algorithms/linear-search";
import { binarySearch } from "./algorithms/binary-search";
import { bubbleSort } from "./algorithms/bubble-sort";
import { stackPushPop } from "./algorithms/stack-push-pop";
import { selectionSort } from "./algorithms/selection-sort";
import { insertionSort } from "./algorithms/insertion-sort";
import { linkedListInsertTail } from "./algorithms/linked-list-insert-tail";
import { binaryTreeInorder } from "./algorithms/binary-tree-inorder";
import { queueEnqueueDequeue } from "./algorithms/queue-enqueue-dequeue";
import { findMaximum } from "./algorithms/find-maximum";
import { prefixSum } from "./algorithms/prefix-sum";
import { insertAtIndex } from "./algorithms/insert-at-index";
import { deleteAtIndex } from "./algorithms/delete-at-index";
import { twoSumSorted } from "./algorithms/two-sum-sorted";
import { reverseInPlace } from "./algorithms/reverse-in-place";
import { removeDuplicatesSorted } from "./algorithms/remove-duplicates-sorted";
import { maxSumSubarrayK } from "./algorithms/max-sum-subarray-k";
import { smallestSubarraySum } from "./algorithms/smallest-subarray-sum";
import { waveA } from "./algorithms/waveA";
import { waveB } from "./algorithms/waveB";
import { waveC } from "./algorithms/waveC";
import { waveD } from "./algorithms/waveD";
import { waveE } from "./algorithms/waveE";
import { waveF } from "./algorithms/waveF";
import { waveG } from "./algorithms/waveG";
import { waveH } from "./algorithms/waveH";
import type { ExecutionTrace } from "@algovision/trace-schema";

// Add each new algorithm here; completeness tests fail if content or definition is missing.
const definitions: readonly AlgorithmDefinition<never>[] = [
  linkedListInsertHead as AlgorithmDefinition<never>,
  linearSearch as AlgorithmDefinition<never>,
  binarySearch as AlgorithmDefinition<never>,
  bubbleSort as AlgorithmDefinition<never>,
  stackPushPop as AlgorithmDefinition<never>,
  queueEnqueueDequeue as AlgorithmDefinition<never>,
  binaryTreeInorder as AlgorithmDefinition<never>,
  selectionSort as AlgorithmDefinition<never>,
  insertionSort as AlgorithmDefinition<never>,
  linkedListInsertTail as AlgorithmDefinition<never>,
  findMaximum as AlgorithmDefinition<never>,
  prefixSum as AlgorithmDefinition<never>,
  insertAtIndex as AlgorithmDefinition<never>,
  deleteAtIndex as AlgorithmDefinition<never>,
  twoSumSorted as AlgorithmDefinition<never>,
  reverseInPlace as AlgorithmDefinition<never>,
  removeDuplicatesSorted as AlgorithmDefinition<never>,
  maxSumSubarrayK as AlgorithmDefinition<never>,
  smallestSubarraySum as AlgorithmDefinition<never>,
  ...waveA,
  ...waveB,
  ...waveC,
  ...waveD,
  ...waveE,
  ...waveF,
  ...waveG,
  ...waveH,
];

export interface RegisteredAlgorithm {
  readonly id: string;
  readonly content: AlgorithmContent;
  readonly definition: AlgorithmDefinition;
}

const registry = new Map<string, RegisteredAlgorithm>();
for (const definition of definitions) {
  const content = generatedContent[definition.id];
  if (content) registry.set(definition.id, { id: definition.id, content, definition: definition as AlgorithmDefinition });
}

export const listAlgorithms = (): readonly RegisteredAlgorithm[] => [...registry.values()];
export const getAlgorithm = (id: string): RegisteredAlgorithm | undefined => registry.get(id);
export const definitionIds = (): readonly string[] => definitions.map((d) => d.id);
export const contentIds = (): readonly string[] => Object.keys(generatedContent);

export type RunResult =
  | { readonly ok: true; readonly trace: ExecutionTrace }
  | { readonly ok: false; readonly errors: readonly { field: string; message: string }[] };

/** Validate raw input then execute; limit overruns are reported as input errors, not crashes. */
export function runAlgorithm(id: string, raw: unknown, limits: LimitProfile): RunResult {
  const entry = registry.get(id);
  if (!entry) return { ok: false, errors: [{ field: "algorithm", message: `Unknown algorithm "${id}".` }] };
  const parsed: InputResult<unknown> = entry.definition.parseInput(raw, limits);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, trace: entry.definition.run(parsed.value, limits) };
  } catch (error) {
    if (error instanceof TraceLimitError) return { ok: false, errors: [{ field: "input", message: error.message }] };
    throw error;
  }
}
