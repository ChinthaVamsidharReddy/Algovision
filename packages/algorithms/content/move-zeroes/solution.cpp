void moveZeroes(int values[], int n) {                 // @a entry
    int write = 0;                                       // @a init-write
    for (int read = 0; read < n; read++) {               // @a loop
        if (values[read] != 0) {                         // @a check-nonzero
            int tmp = values[write];                     // @a swap
            values[write] = values[read];                // @a swap
            values[read] = tmp;                          // @a swap
            write++;                                     // @a advance-write
        }
    }
    return;                                              // @a finish
}
