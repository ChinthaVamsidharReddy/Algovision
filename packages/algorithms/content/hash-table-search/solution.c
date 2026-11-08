int search(const int table[], int size, int key) {       // @a entry
    int index = key % size;                              // @a compute-hash
    for (int tries = 0; tries < size; tries++) {         // @a loop
        if (table[index] == -1) { return -1; }           // @a empty-slot
        if (table[index] == key) { return index; }       // @a found
        index = (index + 1) % size;                      // @a probe-next
    }
    return -1;                                           // @a not-found
}
