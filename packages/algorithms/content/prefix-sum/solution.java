class PrefixSum {
    static void prefixSum(int[] values) {                // @a entry
        for (int i = 1; i < values.length; i++) {        // @a loop
            values[i] = values[i - 1] + values[i];       // @a accumulate
        }
        return;                                          // @a finish
    }
}
