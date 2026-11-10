class Missing {
    static int missing(int[] values) {                   // @a entry
        int n = values.length;
        int expected = n * (n + 1) / 2;                  // @a init
        int sum = 0;                                     // @a init
        for (int x : values) {                           // @a add
            sum += x;                                    // @a add
        }
        return expected - sum;                           // @a finish
    }
}
