class FibonacciDp {
    static int fib(int n) {                              // @a entry
        if (n <= 1) { return n; }                        // @a base-case
        int[] dp = new int[n + 1];                       // @a init-table
        dp[0] = 0;                                       // @a init-table
        dp[1] = 1;                                       // @a init-table
        for (int i = 2; i <= n; i++) {                   // @a loop
            dp[i] = dp[i - 1] + dp[i - 2];               // @a fill
        }
        return dp[n];                                    // @a finish
    }
}
