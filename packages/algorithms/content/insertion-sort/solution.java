class InsertionSort {
    static void sort(int[] values) {                         // @a entry
        for (int i = 1; i < values.length; i++) {            // @a outer-loop
            int key = values[i];                             // @a pick-key
            int j = i - 1;                                   // @a pick-key
            while (j >= 0 && values[j] > key) {              // @a inner-loop
                values[j + 1] = values[j];                   // @a shift
                j--;                                         // @a shift
            }
            values[j + 1] = key;                             // @a insert
        }
        return;                                              // @a finish
    }
}
