class Activities {
    static int select(int[] values) {                    // @a entry
        int count = 0;                                   // @a init
        int lastEnd = -1;                                // @a init
        for (int i = 0; i + 1 < values.length; i += 2) { // @a loop
            if (values[i] >= lastEnd) {                  // @a check
                count++;                                 // @a select
                lastEnd = values[i + 1];                 // @a select
            }
        }
        return count;                                    // @a finish
    }
}
