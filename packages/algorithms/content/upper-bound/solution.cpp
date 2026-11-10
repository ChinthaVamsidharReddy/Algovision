int upperBound(const int values[], int n, int target) {       // @a entry
    int low = 0;                                         // @a init
    int high = n;                                        // @a init
    while (low < high) {                                 // @a loop
        int mid = low + (high - low) / 2;                // @a loop
        if (values[mid] <= target) {                      // @a compare
            low = mid + 1;                               // @a go-right
        } else {
            high = mid;                                  // @a go-left
        }
    }
    return low;                                          // @a finish
}
