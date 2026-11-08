int longestAtMost(const int values[], int n, int target) {   // @a entry
    int left = 0, sum = 0, best = 0;                     // @a init
    for (int right = 0; right < n; right++) {
        sum += values[right];                            // @a add
        while (sum > target) {                           // @a shrink-check
            sum -= values[left];                         // @a shrink
            left++;                                      // @a shrink
        }
        int len = right - left + 1;                      // @a measure
        if (len > best) { best = len; }                  // @a update-best
    }
    return best;                                         // @a finish
}
