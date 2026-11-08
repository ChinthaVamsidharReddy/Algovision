class Fib {
    static int fib(int n) {                              // @a entry
        if (n <= 1) { return n; }                        // @a base-case
        int left = fib(n - 1);                           // @a recurse-left
        int right = fib(n - 2);                          // @a recurse-right
        return left + right;                             // @a combine
    }
}
