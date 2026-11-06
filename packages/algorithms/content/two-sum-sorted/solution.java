class TwoSumSorted {
    static int[] twoSum(int[] values, int target) {      // @a entry
        int left = 0;                                    // @a init-left
        int right = values.length - 1;                   // @a init-right
        while (left < right) {                           // @a loop
            int sum = values[left] + values[right];      // @a sum
            if (sum == target) {                         // @a check-equal
                return new int[] {left, right};          // @a found
            } else if (sum < target) {                   // @a check-less
                left++;                                  // @a move-left
            } else {
                right--;                                 // @a move-right
            }
        }
        return new int[0];                               // @a not-found
    }
}
