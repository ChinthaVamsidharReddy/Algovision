void reverse_range(int values[], int lo, int hi) {
    while (lo < hi) {                                    // @a rev-loop
        int tmp = values[lo];                            // @a rev-swap
        values[lo] = values[hi];                         // @a rev-swap
        values[hi] = tmp;                                // @a rev-swap
        lo++;                                            // @a rev-move
        hi--;                                            // @a rev-move
    }
}

void rotate(int values[], int n, int k) {          // @a entry
    if (n == 0) { return; }                              // @a empty-check
    k = k % n;                                           // @a normalize
    reverse_range(values, 0, k - 1);                     // @a rev-first
    reverse_range(values, k, n - 1);                     // @a rev-second
    reverse_range(values, 0, n - 1);                     // @a rev-all
    return;                                              // @a finish
}
