class Knapsack {
    static int knapsack(int[] items, int capacity) {     // @a entry
        int[] dp = new int[capacity + 1];                // @a init-table
        for (int k = 0; k < items.length; k += 2) {      // @a loop
            int weight = items[k];
            int value = items[k + 1];
            for (int c = capacity; c >= weight; c--) {   // @a inner-loop
                if (dp[c - weight] + value > dp[c]) {    // @a check
                    dp[c] = dp[c - weight] + value;      // @a fill
                }
            }
        }
        return dp[capacity];                             // @a finish
    }
}
