int mergeIntervals(const int values[], int n, int out[]) {         // @a entry
    if (n == 0) { return 0; }                            // @a empty-check
    int count = 0;
    int start = values[0];                               // @a init
    int end = values[1];                                 // @a init
    for (int i = 2; i < n; i += 2) {                     // @a loop
        if (values[i] <= end) {                          // @a overlap
            if (values[i + 1] > end) { end = values[i + 1]; }   // @a merge
        } else {
            out[count++] = start;                        // @a flush
            out[count++] = end;                          // @a flush
            start = values[i];                           // @a flush
            end = values[i + 1];                         // @a flush
        }
    }
    out[count++] = start;                                // @a finish
    out[count++] = end;                                  // @a finish
    return count;                                        // @a finish
}
