void sortColors(int values[], int n) {                 // @a entry
    int low = 0, mid = 0, high = n - 1;                  // @a init
    while (mid <= high) {                                // @a loop
        if (values[mid] == 0) {                          // @a check-zero
            int tmp = values[low];                       // @a zero-swap
            values[low] = values[mid];                   // @a zero-swap
            values[mid] = tmp;                           // @a zero-swap
            low++;                                       // @a zero-swap
            mid++;                                       // @a zero-swap
        } else if (values[mid] == 1) {                   // @a check-one
            mid++;                                       // @a one-advance
        } else {
            int tmp = values[mid];                       // @a two-swap
            values[mid] = values[high];                  // @a two-swap
            values[high] = tmp;                          // @a two-swap
            high--;                                      // @a two-swap
        }
    }
    return;                                              // @a finish
}
