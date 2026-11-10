int min_cost(const int values[], int n) {                    // @a entry
    int dp[16];
    for (int i = 0; i < n; i++) { dp[i] = values[i]; }   // @a init
    for (int i = 2; i < n; i++) {                        // @a fill
        int below = dp[i - 1] < dp[i - 2] ? dp[i - 1] : dp[i - 2];   // @a fill
        dp[i] = values[i] + below;                       // @a fill
    }
    return dp[n - 1] < dp[n - 2] ? dp[n - 1] : dp[n - 2];   // @a finish
}
