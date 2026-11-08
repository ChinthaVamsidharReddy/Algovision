void countingSort(int values[], int n) {                 // @a entry
    int counts[21] = {0};                               // @a init-counts
    for (int i = 0; i < n; i++) {                        // @a count
        counts[values[i]]++;                             // @a count
    }
    int k = 0;
    for (int v = 0; v <= 20; v++) {                      // @a value-loop
        while (counts[v] > 0) {
            values[k++] = v;                             // @a write
            counts[v]--;                                 // @a write
        }
    }
    return;                                              // @a finish
}
