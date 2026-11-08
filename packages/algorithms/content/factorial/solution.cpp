int factorial(int n) {                                        // @a entry
    if (n == 0) { return 1; }                            // @a base-case
    int sub = factorial(n - 1);                               // @a recurse
    return n * sub;                                      // @a combine
}
