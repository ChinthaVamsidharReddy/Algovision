static int line(const int values[], int lo, int hi) {
    int prev = 0, cur = 0;
    for (int i = lo; i <= hi; i++) {                     // @a pick
        int next = (prev + values[i] > cur) ? prev + values[i] : cur;   // @a pick
        prev = cur;                                      // @a pick
        cur = next;                                      // @a pick
    }
    return cur;
}

int robCircle(const int values[], int n) {                    // @a entry
    if (n == 1) { return values[0]; }                    // @a single
    int a = line(values, 0, n - 2);                      // @a rob-first
    int b = line(values, 1, n - 1);                      // @a rob-second
    return a > b ? a : b;                                // @a finish
}
