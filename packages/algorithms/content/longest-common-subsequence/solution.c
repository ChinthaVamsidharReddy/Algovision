#include <stdlib.h>
#include <string.h>

int lcs(const char *s, const char *t) {                  // @a entry
    int m = (int)strlen(s);
    int n = (int)strlen(t);
    int w = n + 1;
    int *dp = calloc((size_t)(m + 1) * (size_t)w, sizeof(int));   // @a init
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s[i - 1] == t[j - 1]) {                  // @a compare
                dp[i * w + j] = dp[(i - 1) * w + j - 1] + 1;   // @a match
            } else {
                int up = dp[(i - 1) * w + j];            // @a skip
                int left = dp[i * w + j - 1];            // @a skip
                dp[i * w + j] = up > left ? up : left;   // @a skip
            }
        }
    }
    int result = dp[m * w + n];
    free(dp);
    return result;                                       // @a finish
}
