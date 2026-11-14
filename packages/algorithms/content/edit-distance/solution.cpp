#include <algorithm>
#include <string>
#include <vector>

int editDistance(const std::string& s, const std::string& t) {   // @a entry
    int m = static_cast<int>(s.size());
    int n = static_cast<int>(t.size());
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));
    for (int i = 0; i <= m; i++) { dp[i][0] = i; }       // @a init
    for (int j = 0; j <= n; j++) { dp[0][j] = j; }       // @a init
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s[i - 1] == t[j - 1]) {                  // @a compare
                dp[i][j] = dp[i - 1][j - 1];             // @a match
            } else {
                dp[i][j] = 1 + std::min({dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]});   // @a edit
            }
        }
    }
    return dp[m][n];                                     // @a finish
}
