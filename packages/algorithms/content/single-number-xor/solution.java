class Single {
    static int single(int[] values) {                    // @a entry
        int result = 0;                                  // @a init
        for (int x : values) {                           // @a xor
            result ^= x;                                 // @a xor
        }
        return result;                                   // @a finish
    }
}
