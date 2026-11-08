int sum_digits(int n) {                                        // @a entry
    if (n < 10) { return n; }                            // @a base-case
    int rest = sum_digits(n / 10);                             // @a recurse
    return n % 10 + rest;                                // @a combine
}
