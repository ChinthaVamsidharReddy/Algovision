int missing(const int values[], int n) {                    // @a entry
    int expected = n * (n + 1) / 2;                      // @a init
    int sum = 0;                                         // @a init
    for (int i = 0; i < n; i++) {                        // @a add
        sum += values[i];                                // @a add
    }
    return expected - sum;                               // @a finish
}
