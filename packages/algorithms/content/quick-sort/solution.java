class QuickSort {
    static void quickSort(int[] values, int lo, int hi) {   // @a entry
        if (lo >= hi) {                                  // @a base-case
            return;                                      // @a base-case
        }
        int pivot = values[hi];                          // @a choose-pivot
        int i = lo;                                      // @a init-i
        for (int j = lo; j < hi; j++) {                  // @a scan
            if (values[j] < pivot) {                     // @a compare
                int tmp = values[i];                     // @a swap
                values[i] = values[j];                   // @a swap
                values[j] = tmp;                         // @a swap
                i++;                                     // @a advance
            }
        }
        int tmp = values[i];                             // @a place-pivot
        values[i] = values[hi];                          // @a place-pivot
        values[hi] = tmp;                                // @a place-pivot
        quickSort(values, lo, i - 1);                    // @a recurse-left
        quickSort(values, i + 1, hi);                    // @a recurse-right
        return;                                          // @a finish
    }
}
