int factorize(int n, int out[]) {                             // @a entry
    int count = 0;
    int d = 2;                                           // @a init
    while (d * d <= n) {                                 // @a loop
        if (n % d == 0) {                                // @a check
            out[count++] = d;                            // @a divide
            n /= d;                                      // @a divide
        } else {
            d++;                                         // @a next
        }
    }
    if (n > 1) { out[count++] = n; }                     // @a remainder
    return count;                                        // @a finish
}
