void delete_at(int values[], int n, int index) {         // @a entry
    for (int i = index; i < n - 1; i++) {                // @a shift-loop
        values[i] = values[i + 1];                       // @a shift
    }
    return;                                              // @a finish
}
