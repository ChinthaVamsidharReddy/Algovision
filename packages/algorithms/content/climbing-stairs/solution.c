int climb(int n) {                                        // @a entry
    if (n <= 2) { return n; }                            // @a base-case
    int dp[16];                                          // @a init-table
    dp[1] = 1;                                           // @a init-table
    dp[2] = 2;                                           // @a init-table
    for (int i = 3; i <= n; i++) {                       // @a loop
        dp[i] = dp[i - 1] + dp[i - 2];                   // @a fill
    }
    return dp[n];                                        // @a finish
}
