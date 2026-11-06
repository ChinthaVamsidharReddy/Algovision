int stackRun(const int values[], int n, int pops, int stack[]) {  // @a entry
    int size = 0;
    for (int i = 0; i < n; i++) {
        stack[size] = values[i];                                  // @a push
        size++;                                                   // @a push
    }
    for (int k = 0; k < pops; k++) {
        if (size == 0) {                                          // @a check-empty
            break;                                                // @a underflow
        }
        size--;                                                   // @a pop
    }
    return size;                                                  // @a finish
}
