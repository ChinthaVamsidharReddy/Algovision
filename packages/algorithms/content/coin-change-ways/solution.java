class CoinWays {
    static int ways(int[] values, int amount) {          // @a entry
        int[] dp = new int[amount + 1];
        dp[0] = 1;                                       // @a init
        for (int coin : values) {                        // @a coin-loop
            for (int a = coin; a <= amount; a++) {       // @a fill
                dp[a] += dp[a - coin];                   // @a fill
            }
        }
        return dp[amount];                               // @a finish
    }
}
