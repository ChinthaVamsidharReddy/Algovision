class BinarySearch {
    static int search(int[] values, int target) {        // @a entry
        int low = 0;                                     // @a init-low
        int high = values.length - 1;                    // @a init-high
        while (low <= high) {                            // @a loop
            int mid = low + (high - low) / 2;            // @a mid
            if (values[mid] == target) {                 // @a compare
                return mid;                              // @a found
            } else if (values[mid] < target) {           // @a check-less
                low = mid + 1;                           // @a go-right
            } else {
                high = mid - 1;                          // @a go-left
            }
        }
        return -1;                                       // @a not-found
    }
}
