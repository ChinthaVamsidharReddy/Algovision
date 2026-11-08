/* C has no built-in hash map. Values are -999..999, so count[v + 999] is the map. */
int count_frequencies(const int values[], int n, int out[]) {   // @a entry
    int count[1999] = {0};                               // @a init-map
    int distinct = 0;                                    // @a init-map
    for (int i = 0; i < n; i++) {                        // @a loop
        int v = values[i];
        if (count[v + 999] == 0) { out[2 * distinct++] = v; }   // @a first-seen
        count[v + 999]++;                                // @a increment
    }
    for (int k = 0; k < distinct; k++) {                 // @a build-output
        out[2 * k + 1] = count[out[2 * k] + 999];        // @a build-output
    }
    return 2 * distinct;                                 // @a finish
}
