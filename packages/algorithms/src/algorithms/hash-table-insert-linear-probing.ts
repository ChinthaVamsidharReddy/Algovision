import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";
import { EMPTY, MAX_KEY } from "./hash-common";

export const ID = "hash-table-insert-linear-probing";
export interface HashInsertInput { readonly values: readonly number[]; readonly size: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<HashInsertInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "key list", valueMin: 0, valueMax: MAX_KEY, valueMessage: `Keys must be whole numbers from 0 to ${MAX_KEY} (-1 marks an empty slot).`,
    fields: [{ name: "size", label: "Table size", min: () => 1, max: (_v, l) => l.maxArrayLength, rangeMessage: (_v, l) => `Table size must be between 1 and ${l.maxArrayLength}.` }],
  }) as InputResult<HashInsertInput>;
}

export function run(input: HashInsertInput, limits: LimitProfile): ExecutionTrace {
  const { values: keys, size } = input;
  const table: number[] = new Array<number>(size).fill(EMPTY);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...keys], size }, maxSteps: limits.maxSteps });
  const filled = () => table.map((v, i) => (v === EMPTY ? -1 : i)).filter((i) => i >= 0);
  const snap = (index: number | null) => snapshot(table, { index });
  const full = () => filled().map((i) => cell(i, "visited"));
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Insert the keys ${fmt(keys)} into a hash table with ${size} slot${size === 1 ? "" : "s"}. A key's home slot is key % ${size}; if it is taken, linear probing tries the next slot, wrapping around.`,
    variables: { size }, state: snap(null),
  });
  b.step({
    event: { type: "init" }, anchor: "init-table", explanation: "Every slot starts empty, shown as -1.", variables: { size }, state: snap(null),
  });
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k]!;
    b.step({
      event: { type: "init" }, anchor: "loop", explanation: `Insert key ${key} (${k + 1} of ${keys.length}).`,
      variables: { key, size }, state: snap(null), highlights: full(),
    });
    let index = key % size;
    let tries = 0;
    b.step({
      event: { type: "movePointer", pointer: "index", to: indexRef(index) }, anchor: "compute-hash",
      explanation: `Hash: ${key} % ${size} = ${index}. Slot ${index} is the home slot.`, variables: { key, index, tries }, state: snap(index),
      highlights: [...full().filter((h) => h.target.kind === "index" && h.target.index !== index), cell(index, "active", "home")],
    });
    for (;;) {
      const occupied = table[index] !== EMPTY && tries < size;
      b.step({
        event: { type: "visit", element: indexRef(index) }, anchor: "probe-check",
        explanation: tries >= size ? `We have tried all ${size} slots and every one is taken.`
          : occupied ? `Slot ${index} already holds ${table[index]}, so it is taken. Probe the next slot.` : `Slot ${index} is empty. The key can go here.`,
        variables: { key, index, tries }, state: snap(index), highlights: [...full().filter((h) => h.target.kind === "index" && h.target.index !== index), cell(index, occupied || tries >= size ? "compared" : "found", occupied ? "taken" : "free")],
      });
      if (!occupied) break;
      index = (index + 1) % size;
      tries++;
      b.step({
        event: { type: "movePointer", pointer: "index", to: indexRef(index) }, anchor: "probe-next",
        explanation: `Move to slot ${index} (wrapping to 0 after the last slot). That was probe ${tries}.`,
        variables: { key, index, tries }, state: snap(index), highlights: [...full().filter((h) => h.target.kind === "index" && h.target.index !== index), cell(index, "active", "probe")],
      });
    }
    if (tries >= size) {
      b.step({
        event: { type: "overflow" }, anchor: "table-full", explanation: `The table is full, so ${key} cannot be stored. It is skipped.`,
        variables: { key, index, tries }, state: snap(null), highlights: full(),
      });
      continue;
    }
    table[index] = key;
    b.step({
      event: { type: "assign", target: indexRef(index), value: key }, anchor: "place",
      explanation: `Store ${key} in slot ${index}${tries > 0 ? ` after ${tries} probe${tries === 1 ? "" : "s"}` : ""}. The table is ${fmt(table)}.`,
      variables: { key, index, tries }, state: snap(index), changed: [indexRef(index)], highlights: [...full().filter((h) => h.target.kind === "index" && h.target.index !== index), cell(index, "created", "stored")], motion: "appear",
    });
  }
  b.step({
    event: { type: "done" }, anchor: "finish", explanation: `Done. Final table: ${fmt(table)} (-1 means empty).`,
    variables: { size }, state: snap(null), highlights: full(),
  });
  return b.build({ time: "O(n) average", space: "O(m)", result: [...table] });
}

export const hashTableInsertLinearProbing: AlgorithmDefinition<HashInsertInput> = { id: ID, parseInput, run };
