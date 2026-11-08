#include <vector>


int knapsack(const int items[], int n, int capacity) {   // @a entry
    std::vector<int> dp(capacity + 1, 0);                // @a init-table
    for (int k = 0; k < n; k += 2) {                     // @a loop
        int weight = items[k];
        int value = items[k + 1];
        for (int c = capacity; c >= weight; c--) {       // @a inner-loop
            if (dp[c - weight] + value > dp[c]) {        // @a check
                dp[c] = dp[c - weight] + value;          // @a fill
            }
        }
    }
    return dp[capacity];                                 // @a finish
}
