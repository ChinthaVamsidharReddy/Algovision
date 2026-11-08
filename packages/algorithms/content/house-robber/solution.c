#include <stdlib.h>


int rob(const int values[], int n) {                     // @a entry
    if (n == 0) { return 0; }                            // @a base-case
    int *dp = calloc((size_t)n + 1, sizeof(int));        // @a init-table
    dp[1] = values[0];                                   // @a init-table
    for (int i = 2; i <= n; i++) {                       // @a loop
        int take = dp[i - 2] + values[i - 1];            // @a take
        int skip = dp[i - 1];                            // @a skip
        dp[i] = take > skip ? take : skip;               // @a fill
    }
    int best = dp[n];                                    // @a finish
    free(dp);
    return best;
}
