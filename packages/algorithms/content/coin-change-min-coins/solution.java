import java.util.Arrays;


class Coins {
    static int coinChange(int[] coins, int amount) {     // @a entry
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);                     // @a init-table
        dp[0] = 0;                                       // @a init-table
        for (int a = 1; a <= amount; a++) {              // @a loop
            for (int coin : coins) {                     // @a try-coin
                if (coin <= a && dp[a - coin] + 1 < dp[a]) {   // @a check
                    dp[a] = dp[a - coin] + 1;            // @a fill
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];    // @a finish
    }
}
