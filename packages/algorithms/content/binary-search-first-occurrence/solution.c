int first_occurrence(const int values[], int n, int target) {   // @a entry
    int low = 0;                                         // @a init-low
    int high = n - 1;                                    // @a init-high
    int result = -1;                                     // @a init-result
    while (low <= high) {                                // @a loop
        int mid = low + (high - low) / 2;                // @a mid
        if (values[mid] == target) {                     // @a check-equal
            result = mid;                                // @a record
            high = mid - 1;                              // @a go-left-eq
        } else if (values[mid] < target) {               // @a check-less
            low = mid + 1;                               // @a go-right
        } else {
            high = mid - 1;                              // @a go-left
        }
    }
    return result;                                       // @a finish
}
