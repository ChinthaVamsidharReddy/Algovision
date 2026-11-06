class SmallestSubarray {
    static int minSubarrayLen(int[] values, int target) {  // @a entry
        int left = 0;                                    // @a init-left
        int sum = 0;                                     // @a init-sum
        int best = 0;                                    // @a init-best
        for (int right = 0; right < values.length; right++) {  // @a expand
            sum += values[right];                        // @a add
            while (sum >= target) {                      // @a shrink-check
                int length = right - left + 1;           // @a measure
                if (best == 0 || length < best) {        // @a compare
                    best = length;                       // @a new-best
                }
                sum -= values[left];                     // @a shrink
                left++;                                  // @a shrink
            }
        }
        return best;                                     // @a finish
    }
}
