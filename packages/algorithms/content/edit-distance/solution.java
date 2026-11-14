class Edit {
    static int distance(String s, String t) {            // @a entry
        int m = s.length();
        int n = t.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) { dp[i][0] = i; }   // @a init
        for (int j = 0; j <= n; j++) { dp[0][j] = j; }   // @a init
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (s.charAt(i - 1) == t.charAt(j - 1)) {          // @a compare
                    dp[i][j] = dp[i - 1][j - 1];         // @a match
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));   // @a edit
                }
            }
        }
        return dp[m][n];                                 // @a finish
    }
}
