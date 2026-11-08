/** Linear-probing table helpers shared by the hashing executors. -1 marks an empty slot. */
export const EMPTY = -1;
export const MAX_KEY = 999;

/** Builds the table the same way hash-table-insert-linear-probing does (a key that finds no free slot is dropped). */
export function buildTable(keys: readonly number[], size: number): number[] {
  const table: number[] = new Array<number>(size).fill(EMPTY);
  for (const key of keys) {
    let index = key % size;
    let tries = 0;
    while (table[index] !== EMPTY && tries < size) {
      index = (index + 1) % size;
      tries++;
    }
    if (tries < size) table[index] = key;
  }
  return table;
}
