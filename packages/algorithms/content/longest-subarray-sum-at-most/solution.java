class LongestAtMost {
    static int longestAtMost(int[] values, int target) { // @a entry
        int left = 0, sum = 0, best = 0;                 // @a init
        for (int right = 0; right < values.length; right++) {
            sum += values[right];                        // @a add
            while (sum > target) {                       // @a shrink-check
                sum -= values[left];                     // @a shrink
                left++;                                  // @a shrink
            }
            int len = right - left + 1;                  // @a measure
            if (len > best) { best = len; }              // @a update-best
        }
        return best;                                     // @a finish
    }
}
