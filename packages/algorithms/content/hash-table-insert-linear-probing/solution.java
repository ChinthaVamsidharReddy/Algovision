import java.util.Arrays;


class HashTable {
    static int[] insertAll(int[] keys, int size) {       // @a entry
        int[] table = new int[size];
        Arrays.fill(table, -1);                          // @a init-table
        for (int key : keys) {                           // @a loop
            int index = key % size;                      // @a compute-hash
            int tries = 0;
            while (table[index] != -1 && tries < size) { // @a probe-check
                index = (index + 1) % size;              // @a probe-next
                tries++;                                 // @a probe-next
            }
            if (tries == size) { continue; }             // @a table-full
            table[index] = key;                          // @a place
        }
        return table;                                    // @a finish
    }
}
