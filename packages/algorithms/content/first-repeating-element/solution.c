/* C has no built-in hash set. Values are 0..999, so seen[v] is the set. */
int first_repeating(const int values[], int n) {         // @a entry
    int seen[1000] = {0};                                // @a init-set
    for (int i = 0; i < n; i++) {                        // @a loop
        int v = values[i];
        if (seen[v]) {                                   // @a check-seen
            return v;                                    // @a found
        }
        seen[v] = 1;                                     // @a store
    }
    return -1;                                           // @a not-found
}
