#include <stdlib.h>


int knapsack(const int items[], int n, int capacity) {   // @a entry
    int *dp = calloc((size_t)capacity + 1, sizeof(int)); // @a init-table
    for (int k = 0; k < n; k += 2) {                     // @a loop
        int weight = items[k];
        int value = items[k + 1];
        for (int c = capacity; c >= weight; c--) {       // @a inner-loop
            if (dp[c - weight] + value > dp[c]) {        // @a check
                dp[c] = dp[c - weight] + value;          // @a fill
            }
        }
    }
    int best = dp[capacity];                             // @a finish
    free(dp);
    return best;
}
