import java.util.Arrays;


class Lis {
    static int lis(int[] values) {                       // @a entry
        int n = values.length;
        if (n == 0) { return 0; }                        // @a base-case
        int[] dp = new int[n];
        Arrays.fill(dp, 1);                              // @a init-table
        int best = 1;
        for (int i = 1; i < n; i++) {                    // @a loop
            for (int j = 0; j < i; j++) {                // @a inner-loop
                if (values[j] < values[i] && dp[j] + 1 > dp[i]) {   // @a check
                    dp[i] = dp[j] + 1;                   // @a fill
                }
            }
            if (dp[i] > best) { best = dp[i]; }          // @a update-best
        }
        return best;                                     // @a finish
    }
}
