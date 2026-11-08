#include <vector>


int lis(const int values[], int n) {                     // @a entry
    if (n == 0) { return 0; }                            // @a base-case
    std::vector<int> dp(n, 1);                           // @a init-table
    int best = 1;
    for (int i = 1; i < n; i++) {                        // @a loop
        for (int j = 0; j < i; j++) {                    // @a inner-loop
            if (values[j] < values[i] && dp[j] + 1 > dp[i]) {   // @a check
                dp[i] = dp[j] + 1;                       // @a fill
            }
        }
        if (dp[i] > best) { best = dp[i]; }              // @a update-best
    }
    return best;                                         // @a finish
}
