import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";
import { buildTable, EMPTY, MAX_KEY } from "./hash-common";

export const ID = "hash-table-search";
export interface HashSearchInput { readonly values: readonly number[]; readonly size: number; readonly key: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<HashSearchInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "key list", valueMin: 0, valueMax: MAX_KEY, valueMessage: `Keys must be whole numbers from 0 to ${MAX_KEY}.`,
    fields: [
      { name: "size", label: "Table size", min: () => 1, max: (_v, l) => l.maxArrayLength, rangeMessage: (_v, l) => `Table size must be between 1 and ${l.maxArrayLength}.` },
      { name: "key", label: "Key to find", min: () => 0, max: () => MAX_KEY, rangeMessage: () => `Key to find must be between 0 and ${MAX_KEY}.` },
    ],
  }) as InputResult<HashSearchInput>;
}

export function run(input: HashSearchInput, limits: LimitProfile): ExecutionTrace {
  const { values: keys, size, key } = input;
  const table = buildTable(keys, size);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...keys], size, key }, maxSteps: limits.maxSteps });
  const snap = (index: number | null) => snapshot(table, { index });
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `The keys ${fmt(keys)} were stored in a ${size}-slot hash table with linear probing: ${fmt(table)} (-1 is empty). Now look for ${key}.`,
    variables: { key, size }, state: snap(null),
  });
  let index = key % size;
  b.step({
    event: { type: "movePointer", pointer: "index", to: indexRef(index) }, anchor: "compute-hash",
    explanation: `Hash: ${key} % ${size} = ${index}. Start looking in slot ${index}.`, variables: { key, index }, state: snap(index), highlights: [cell(index, "active", "home")],
  });
  let result = -1;
  for (let tries = 0; tries < size; tries++) {
    b.step({
      event: { type: "init" }, anchor: "loop", explanation: `Probe ${tries + 1} of at most ${size}: look at slot ${index}.`,
      variables: { key, index, tries }, state: snap(index), highlights: [cell(index, "active", "probe")],
    });
    if (table[index] === EMPTY) {
      b.step({
        event: { type: "notFound" }, anchor: "empty-slot",
        explanation: `Slot ${index} is empty. If ${key} had been inserted it would have stopped here or earlier, so ${key} is not in the table.`,
        variables: { key, index, tries }, state: snap(index), highlights: [cell(index, "compared", "empty")],
      });
      return b.build({ time: "O(1) average", space: "O(1)", result });
    }
    if (table[index] === key) {
      b.step({
        event: { type: "found", element: indexRef(index) }, anchor: "found", explanation: `Slot ${index} holds ${key}. Found it.`,
        variables: { key, index, tries }, state: snap(index), highlights: [cell(index, "found", "found")],
      });
      result = index;
      return b.build({ time: "O(1) average", space: "O(1)", result });
    }
    const was = index;
    index = (index + 1) % size;
    b.step({
      event: { type: "movePointer", pointer: "index", to: indexRef(index) }, anchor: "probe-next",
      explanation: `Slot ${was} holds ${table[was]}, not ${key}. Move to slot ${index}.`, variables: { key, index, tries: tries + 1 }, state: snap(index),
      highlights: [cell(was, "compared"), cell(index, "active", "probe")],
    });
  }
  b.step({
    event: { type: "notFound" }, anchor: "not-found", explanation: `Every slot has been checked and none holds ${key}, so it is not in the table.`,
    variables: { key, index }, state: snap(null),
  });
  return b.build({ time: "O(m)", space: "O(1)", result });
}

export const hashTableSearch: AlgorithmDefinition<HashSearchInput> = { id: ID, parseInput, run };
