class BubbleSort {
    static void sort(int[] values) {                           // @a entry
        for (int end = values.length - 1; end > 0; end--) {    // @a outer-loop
            for (int j = 0; j < end; j++) {                    // @a inner-loop
                if (values[j] > values[j + 1]) {               // @a compare
                    int temp = values[j];                      // @a swap
                    values[j] = values[j + 1];                 // @a swap
                    values[j + 1] = temp;                      // @a swap
                }
            }
        }
        return;                                                // @a finish
    }
}
