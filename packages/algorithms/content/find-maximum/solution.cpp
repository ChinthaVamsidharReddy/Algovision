int findMaximum(const int values[], int n) {             // @a entry
    int best = values[0];                                // @a init-max
    for (int i = 1; i < n; i++) {                        // @a loop
        if (values[i] > best) {                          // @a compare
            best = values[i];                            // @a update
        }
    }
    return best;                                         // @a finish
}
