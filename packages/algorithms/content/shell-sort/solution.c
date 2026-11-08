void shell_sort(int values[], int n) {                 // @a entry
    for (int gap = n / 2; gap > 0; gap /= 2) {           // @a gap-loop
        for (int i = gap; i < n; i++) {
            int temp = values[i];                        // @a pick
            int j = i;                                   // @a pick
            while (j >= gap && values[j - gap] > temp) { // @a compare
                values[j] = values[j - gap];             // @a shift
                j -= gap;                                // @a shift
            }
            values[j] = temp;                            // @a place
        }
    }
    return;                                              // @a finish
}
