class SubsetDp {
    static int canMake(int[] values, int target) {       // @a entry
        int[] dp = new int[target + 1];
        dp[0] = 1;                                       // @a init
        for (int v : values) {                           // @a item-loop
            for (int s = target; s >= v; s--) {          // @a fill
                if (dp[s - v] == 1) { dp[s] = 1; }       // @a fill
            }
        }
        return dp[target];                               // @a finish
    }
}
