void prefix_sum(int values[], int n) {                   // @a entry
    for (int i = 1; i < n; i++) {                        // @a loop
        values[i] = values[i - 1] + values[i];           // @a accumulate
    }
    return;                                              // @a finish
}
