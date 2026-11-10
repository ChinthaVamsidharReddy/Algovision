class ClimbCost {
    static int minCost(int[] values) {                   // @a entry
        int n = values.length;
        int[] dp = values.clone();                       // @a init
        for (int i = 2; i < n; i++) {                    // @a fill
            dp[i] = values[i] + Math.min(dp[i - 1], dp[i - 2]);   // @a fill
        }
        return Math.min(dp[n - 1], dp[n - 2]);           // @a finish
    }
}
