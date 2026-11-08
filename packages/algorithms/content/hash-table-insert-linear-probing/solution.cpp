void insertAll(const int keys[], int n, int size, int table[]) {   // @a entry
    for (int i = 0; i < size; i++) { table[i] = -1; }    // @a init-table
    for (int k = 0; k < n; k++) {                        // @a loop
        int key = keys[k];
        int index = key % size;                          // @a compute-hash
        int tries = 0;
        while (table[index] != -1 && tries < size) {     // @a probe-check
            index = (index + 1) % size;                  // @a probe-next
            tries++;                                     // @a probe-next
        }
        if (tries == size) { continue; }                 // @a table-full
        table[index] = key;                              // @a place
    }
    return;                                              // @a finish
}
