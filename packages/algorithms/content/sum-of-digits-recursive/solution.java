class Digits {
    static int sumDigits(int n) {                        // @a entry
        if (n < 10) { return n; }                        // @a base-case
        int rest = sumDigits(n / 10);                    // @a recurse
        return n % 10 + rest;                            // @a combine
    }
}
