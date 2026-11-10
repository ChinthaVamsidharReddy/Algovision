class RobberCircle {
    static int rob(int[] values) {                       // @a entry
        int n = values.length;
        if (n == 1) { return values[0]; }                // @a single
        int a = line(values, 0, n - 2);                  // @a rob-first
        int b = line(values, 1, n - 1);                  // @a rob-second
        return Math.max(a, b);                           // @a finish
    }

    static int line(int[] values, int lo, int hi) {
        int prev = 0, cur = 0;
        for (int i = lo; i <= hi; i++) {                 // @a pick
            int next = Math.max(cur, prev + values[i]);  // @a pick
            prev = cur;                                  // @a pick
            cur = next;                                  // @a pick
        }
        return cur;
    }
}
