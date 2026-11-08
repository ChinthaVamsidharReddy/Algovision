class CountingSort {
    static void countingSort(int[] values) {             // @a entry
        int[] counts = new int[21];                      // @a init-counts
        for (int i = 0; i < values.length; i++) {        // @a count
            counts[values[i]]++;                         // @a count
        }
        int k = 0;
        for (int v = 0; v <= 20; v++) {                  // @a value-loop
            while (counts[v] > 0) {
                values[k++] = v;                         // @a write
                counts[v]--;                             // @a write
            }
        }
        return;                                          // @a finish
    }
}
