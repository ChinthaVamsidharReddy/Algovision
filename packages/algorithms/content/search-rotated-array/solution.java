class Rotated {
    static int search(int[] values, int target) {        // @a entry
        int low = 0;                                     // @a init
        int high = values.length - 1;                    // @a init
        while (low <= high) {                            // @a loop
            int mid = low + (high - low) / 2;            // @a loop
            if (values[mid] == target) { return mid; }   // @a found
            if (values[low] <= values[mid]) {            // @a which-half
                if (values[low] <= target && target < values[mid]) {
                    high = mid - 1;                      // @a in-left
                } else {
                    low = mid + 1;                       // @a in-right
                }
            } else {
                if (values[mid] < target && target <= values[high]) {
                    low = mid + 1;                       // @a in-right
                } else {
                    high = mid - 1;                      // @a in-left
                }
            }
        }
        return -1;                                       // @a finish
    }
}
