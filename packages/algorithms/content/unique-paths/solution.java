class Paths {
    static int paths(int rows, int cols) {               // @a entry
        int[] dp = new int[cols];
        for (int j = 0; j < cols; j++) {                 // @a init
            dp[j] = 1;                                   // @a init
        }
        for (int i = 1; i < rows; i++) {                 // @a row
            for (int j = 1; j < cols; j++) {             // @a fill
                dp[j] += dp[j - 1];                      // @a fill
            }
        }
        return dp[cols - 1];                             // @a finish
    }
}
