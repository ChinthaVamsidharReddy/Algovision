import type { AlgorithmDefinition } from "../definition";
import { linkedListDeleteValue } from "./linked-list-delete-value";
import { linkedListFindMiddle } from "./linked-list-find-middle";
import { linkedListInsertAtPosition } from "./linked-list-insert-at-position";
import { linkedListRemoveNthFromEnd } from "./linked-list-remove-nth-from-end";
import { linkedListReverse } from "./linked-list-reverse";
import { linkedListSearch } from "./linked-list-search";

/** Wave C: linked lists. */
export const waveC: readonly AlgorithmDefinition<never>[] = [
  linkedListSearch as AlgorithmDefinition<never>,
  linkedListDeleteValue as AlgorithmDefinition<never>,
  linkedListReverse as AlgorithmDefinition<never>,
  linkedListFindMiddle as AlgorithmDefinition<never>,
  linkedListRemoveNthFromEnd as AlgorithmDefinition<never>,
  linkedListInsertAtPosition as AlgorithmDefinition<never>,
];
