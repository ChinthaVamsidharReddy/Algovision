class Power {
    static int power(int base, int exp) {                // @a entry
        if (exp == 0) { return 1; }                      // @a base-case
        int half = power(base, exp / 2);                 // @a recurse
        if (exp % 2 == 0) { return half * half; }       // @a combine-even
        return half * half * base;                       // @a combine-odd
    }
}
