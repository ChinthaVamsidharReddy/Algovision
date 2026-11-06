int two_sum_sorted(const int values[], int n, int target, int result[2]) {  // @a entry
    int left = 0;                                        // @a init-left
    int right = n - 1;                                   // @a init-right
    while (left < right) {                               // @a loop
        int sum = values[left] + values[right];          // @a sum
        if (sum == target) {                             // @a check-equal
            result[0] = left;                            // @a found
            result[1] = right;                           // @a found
            return 2;                                    // @a found
        } else if (sum < target) {                       // @a check-less
            left++;                                      // @a move-left
        } else {
            right--;                                     // @a move-right
        }
    }
    return 0;                                            // @a not-found
}
