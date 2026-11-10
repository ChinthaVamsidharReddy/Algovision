int count_bits(int n) {                                        // @a entry
    int count = 0;                                       // @a init
    while (n != 0) {                                     // @a loop
        n &= n - 1;                                      // @a clear
        count++;                                         // @a clear
    }
    return count;                                        // @a finish
}
