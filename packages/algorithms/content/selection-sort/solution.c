void selection_sort(int values[], int n) {            // @a entry
    for (int i = 0; i < n - 1; i++) {                // @a outer-loop
        int min = i;                                 // @a init-min
        for (int j = i + 1; j < n; j++) {            // @a inner-loop
            if (values[j] < values[min]) {           // @a compare
                min = j;                             // @a new-min
            }
        }
        int temp = values[i];                        // @a swap
        values[i] = values[min];                     // @a swap
        values[min] = temp;                          // @a swap
    }
    return;                                          // @a finish
}
