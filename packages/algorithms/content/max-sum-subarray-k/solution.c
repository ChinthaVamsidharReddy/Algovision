int max_sum_subarray(const int values[], int n, int k) {    // @a entry
    int windowSum = 0;                                   // @a init-sum
    for (int i = 0; i < k; i++) {                        // @a first-window
        windowSum += values[i];                          // @a first-window
    }
    int best = windowSum;                                // @a init-best
    for (int right = k; right < n; right++) {            // @a slide
        windowSum += values[right] - values[right - k];  // @a update-sum
        if (windowSum > best) {                          // @a compare
            best = windowSum;                            // @a new-best
        }
    }
    return best;                                         // @a finish
}
