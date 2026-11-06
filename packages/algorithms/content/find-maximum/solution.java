class FindMaximum {
    static int findMaximum(int[] values) {               // @a entry
        int best = values[0];                            // @a init-max
        for (int i = 1; i < values.length; i++) {        // @a loop
            if (values[i] > best) {                      // @a compare
                best = values[i];                        // @a update
            }
        }
        return best;                                     // @a finish
    }
}
