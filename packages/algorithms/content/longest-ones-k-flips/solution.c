int longest_ones(const int values[], int n, int k) {     // @a entry
    int left = 0, zeros = 0, best = 0;                   // @a init
    for (int right = 0; right < n; right++) {            // @a expand
        if (values[right] == 0) { zeros++; }             // @a count-zero
        while (zeros > k) {                              // @a shrink-check
            if (values[left] == 0) { zeros--; }          // @a drop
            left++;                                      // @a drop
        }
        int len = right - left + 1;                      // @a measure
        if (len > best) { best = len; }                  // @a update-best
    }
    return best;                                         // @a finish
}
