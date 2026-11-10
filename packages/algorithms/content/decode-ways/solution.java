class Decode {
    static int decode(int[] values) {                    // @a entry
        int n = values.length;
        int[] dp = new int[n + 1];
        dp[0] = 1;                                       // @a init
        dp[1] = values[0] != 0 ? 1 : 0;                  // @a init
        for (int i = 2; i <= n; i++) {                   // @a fill
            int one = values[i - 1];
            int two = values[i - 2] * 10 + values[i - 1];
            if (one != 0) { dp[i] += dp[i - 1]; }        // @a fill
            if (two >= 10 && two <= 26) { dp[i] += dp[i - 2]; }   // @a fill
        }
        return dp[n];                                    // @a finish
    }
}
