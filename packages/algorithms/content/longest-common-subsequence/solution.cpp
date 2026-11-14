#include <algorithm>
#include <string>
#include <vector>

int lcs(const std::string& s, const std::string& t) {    // @a entry
    int m = static_cast<int>(s.size());
    int n = static_cast<int>(t.size());
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));   // @a init
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s[i - 1] == t[j - 1]) {                  // @a compare
                dp[i][j] = dp[i - 1][j - 1] + 1;         // @a match
            } else {
                dp[i][j] = std::max(dp[i - 1][j], dp[i][j - 1]);   // @a skip
            }
        }
    }
    return dp[m][n];                                     // @a finish
}
