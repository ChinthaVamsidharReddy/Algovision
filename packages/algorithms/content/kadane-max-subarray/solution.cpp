int kadane(const int values[], int n) {            // @a entry
    int current = values[0];                             // @a init
    int best = values[0];                                // @a init
    for (int i = 1; i < n; i++) {                        // @a loop
        if (current < 0) {                               // @a decide
            current = values[i];                         // @a restart
        } else {
            current += values[i];                        // @a extend
        }
        if (current > best) { best = current; }          // @a update-best
    }
    return best;                                         // @a finish
}
