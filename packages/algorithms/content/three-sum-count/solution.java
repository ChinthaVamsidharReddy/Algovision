class ThreeSum {
    static int threeSumCount(int[] values) {             // @a entry
        int n = values.length;
        int count = 0;                                   // @a init-count
        for (int i = 0; i < n - 2; i++) {                // @a outer
            if (i > 0 && values[i] == values[i - 1]) { continue; }   // @a skip-dup-i
            int left = i + 1;                            // @a init-pointers
            int right = n - 1;                           // @a init-pointers
            while (left < right) {                       // @a loop
                int sum = values[i] + values[left] + values[right];  // @a sum
                if (sum == 0) {                          // @a check-zero
                    count++;                             // @a found
                    left++;                              // @a found
                    right--;                             // @a found
                    while (left < right && values[left] == values[left - 1]) { left++; }   // @a skip-dup
                } else if (sum < 0) {                    // @a check-neg
                    left++;                              // @a move-left
                } else {
                    right--;                             // @a move-right
                }
            }
        }
        return count;                                    // @a finish
    }
}
