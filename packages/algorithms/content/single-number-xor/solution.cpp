int single(const int values[], int n) {                    // @a entry
    int result = 0;                                      // @a init
    for (int i = 0; i < n; i++) {                        // @a xor
        result ^= values[i];                             // @a xor
    }
    return result;                                       // @a finish
}
