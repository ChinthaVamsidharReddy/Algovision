int coinWays(const int values[], int n, int amount) {        // @a entry
    int dp[21] = {0};
    dp[0] = 1;                                           // @a init
    for (int k = 0; k < n; k++) {                        // @a coin-loop
        for (int a = values[k]; a <= amount; a++) {      // @a fill
            dp[a] += dp[a - values[k]];                  // @a fill
        }
    }
    return dp[amount];                                   // @a finish
}
