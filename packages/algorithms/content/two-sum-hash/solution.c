/* C has no built-in hash map. Values are -999..999, so an array indexed by value + 999 plays that role. */
int two_sum(const int values[], int n, int target, int out[]) {   // @a entry
    int seen[1999];
    for (int k = 0; k < 1999; k++) { seen[k] = -1; }     // @a init-map
    for (int j = 0; j < n; j++) {                        // @a loop
        int need = target - values[j];                   // @a compute-complement
        if (need >= -999 && need <= 999 && seen[need + 999] != -1) {   // @a check-seen
            out[0] = seen[need + 999];                   // @a found
            out[1] = j;                                  // @a found
            return 2;                                    // @a found
        }
        seen[values[j] + 999] = j;                       // @a store
    }
    return 0;                                            // @a not-found
}
