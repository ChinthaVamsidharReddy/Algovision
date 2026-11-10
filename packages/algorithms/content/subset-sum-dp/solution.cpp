int canMake(const int values[], int n, int target) {        // @a entry
    int dp[31] = {0};
    dp[0] = 1;                                           // @a init
    for (int k = 0; k < n; k++) {                        // @a item-loop
        for (int s = target; s >= values[k]; s--) {      // @a fill
            if (dp[s - values[k]] == 1) { dp[s] = 1; }   // @a fill
        }
    }
    return dp[target];                                   // @a finish
}
