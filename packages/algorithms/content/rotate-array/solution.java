class RotateArray {
    static void reverse(int[] values, int lo, int hi) {
        while (lo < hi) {                                // @a rev-loop
            int tmp = values[lo];                        // @a rev-swap
            values[lo] = values[hi];                     // @a rev-swap
            values[hi] = tmp;                            // @a rev-swap
            lo++;                                        // @a rev-move
            hi--;                                        // @a rev-move
        }
    }

    static void rotate(int[] values, int k) {            // @a entry
        int n = values.length;
        if (n == 0) { return; }                          // @a empty-check
        k = k % n;                                       // @a normalize
        reverse(values, 0, k - 1);                       // @a rev-first
        reverse(values, k, n - 1);                       // @a rev-second
        reverse(values, 0, n - 1);                       // @a rev-all
        return;                                          // @a finish
    }
}
