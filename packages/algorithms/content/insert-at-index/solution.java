class InsertAtIndex {
    static void insertAt(int[] values, int n, int index, int value) {  // @a entry
        for (int i = n; i > index; i--) {                // @a shift-loop
            values[i] = values[i - 1];                   // @a shift
        }
        values[index] = value;                           // @a place
        return;                                          // @a finish
    }
}
