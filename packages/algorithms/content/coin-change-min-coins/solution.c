#define MAX_AMOUNT 20

int coin_change(const int coins[], int n, int amount) {         // @a entry
    int dp[MAX_AMOUNT + 1];
    for (int a = 0; a <= amount; a++) { dp[a] = amount + 1; }   // @a init-table
    dp[0] = 0;                                           // @a init-table
    for (int a = 1; a <= amount; a++) {                  // @a loop
        for (int k = 0; k < n; k++) {                    // @a try-coin
            int coin = coins[k];
            if (coin <= a && dp[a - coin] + 1 < dp[a]) { // @a check
                dp[a] = dp[a - coin] + 1;                // @a fill
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];        // @a finish
}
