class Robber {
    static int rob(int[] values) {                       // @a entry
        int n = values.length;
        if (n == 0) { return 0; }                        // @a base-case
        int[] dp = new int[n + 1];                       // @a init-table
        dp[1] = values[0];                               // @a init-table
        for (int i = 2; i <= n; i++) {                   // @a loop
            int take = dp[i - 2] + values[i - 1];        // @a take
            int skip = dp[i - 1];                        // @a skip
            dp[i] = Math.max(take, skip);                // @a fill
        }
        return dp[n];                                    // @a finish
    }
}
