int countPrimes(int n) {                                        // @a entry
    int flags[16] = {0};
    for (int i = 2; i <= n; i++) {                       // @a init
        flags[i] = 1;                                    // @a init
    }
    for (int p = 2; p * p <= n; p++) {                   // @a loop
        if (flags[p] == 1) {                             // @a check-prime
            for (int m = p * p; m <= n; m += p) {        // @a mark
                flags[m] = 0;                            // @a mark
            }
        }
    }
    int count = 0;
    for (int i = 2; i <= n; i++) {                       // @a finish
        count += flags[i];                               // @a finish
    }
    return count;                                        // @a finish
}
