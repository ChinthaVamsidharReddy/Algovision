class LinearSearch {
    static int search(int[] values, int target) {      // @a entry
        for (int i = 0; i < values.length; i++) {      // @a loop
            if (values[i] == target) {                 // @a compare
                return i;                              // @a found
            }
        }
        return -1;                                     // @a not-found
    }
}
