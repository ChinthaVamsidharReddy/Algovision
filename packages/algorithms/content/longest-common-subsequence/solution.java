class Lcs {
    static int lcs(String s, String t) {                 // @a entry
        int m = s.length();
        int n = t.length();
        int[][] dp = new int[m + 1][n + 1];              // @a init
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (s.charAt(i - 1) == t.charAt(j - 1)) {          // @a compare
                    dp[i][j] = dp[i - 1][j - 1] + 1;    // @a match
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);   // @a skip
                }
            }
        }
        return dp[m][n];                                 // @a finish
    }
}
