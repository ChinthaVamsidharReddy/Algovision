std::vector<int> twoSumSorted(const int values[], int n, int target) {  // @a entry
    int left = 0;                                        // @a init-left
    int right = n - 1;                                   // @a init-right
    while (left < right) {                               // @a loop
        int sum = values[left] + values[right];          // @a sum
        if (sum == target) {                             // @a check-equal
            return {left, right};                        // @a found
        } else if (sum < target) {                       // @a check-less
            left++;                                      // @a move-left
        } else {
            right--;                                     // @a move-right
        }
    }
    return {};                                           // @a not-found
}
