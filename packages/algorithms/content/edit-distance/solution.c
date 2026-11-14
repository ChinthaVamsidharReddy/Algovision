#include <stdlib.h>
#include <string.h>

int edit_distance(const char *s, const char *t) {        // @a entry
    int m = (int)strlen(s);
    int n = (int)strlen(t);
    int w = n + 1;
    int *dp = malloc(sizeof(int) * (size_t)(m + 1) * (size_t)w);
    for (int i = 0; i <= m; i++) { dp[i * w] = i; }      // @a init
    for (int j = 0; j <= n; j++) { dp[j] = j; }          // @a init
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s[i - 1] == t[j - 1]) {                  // @a compare
                dp[i * w + j] = dp[(i - 1) * w + j - 1]; // @a match
            } else {
                int best = dp[(i - 1) * w + j - 1];      // @a edit
                if (dp[(i - 1) * w + j] < best) best = dp[(i - 1) * w + j];   // @a edit
                if (dp[i * w + j - 1] < best) best = dp[i * w + j - 1];       // @a edit
                dp[i * w + j] = 1 + best;                // @a edit
            }
        }
    }
    int result = dp[m * w + n];
    free(dp);
    return result;                                       // @a finish
}
