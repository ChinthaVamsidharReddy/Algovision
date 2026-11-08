class MoveZeroes {
    static void moveZeroes(int[] values) {               // @a entry
        int write = 0;                                   // @a init-write
        for (int read = 0; read < values.length; read++) {   // @a loop
            if (values[read] != 0) {                     // @a check-nonzero
                int tmp = values[write];                 // @a swap
                values[write] = values[read];            // @a swap
                values[read] = tmp;                      // @a swap
                write++;                                 // @a advance-write
            }
        }
        return;                                          // @a finish
    }
}
