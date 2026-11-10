void nextPermutation(int values[], int n) {                         // @a entry
    int i = n - 2;                                       // @a init
    while (i >= 0 && values[i] >= values[i + 1]) {       // @a find-pivot
        i--;                                             // @a find-pivot
    }
    if (i >= 0) {                                        // @a find-pivot
        int j = n - 1;                                   // @a find-swap
        while (values[j] <= values[i]) {                 // @a find-swap
            j--;                                         // @a find-swap
        }
        int temp = values[i];                            // @a swap
        values[i] = values[j];                           // @a swap
        values[j] = temp;                                // @a swap
    }
    int lo = i + 1;                                      // @a reverse-init
    int hi = n - 1;                                      // @a reverse-init
    while (lo < hi) {                                    // @a reverse
        int temp = values[lo];                           // @a reverse
        values[lo] = values[hi];                         // @a reverse
        values[hi] = temp;                               // @a reverse
        lo++;                                            // @a reverse
        hi--;                                            // @a reverse
    }
    return;                                              // @a finish
}
