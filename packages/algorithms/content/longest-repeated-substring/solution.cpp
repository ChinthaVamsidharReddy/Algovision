#include <array>
#include <string>
#include <vector>

int longestRepeated(const std::string& s) {               // @a entry
    int n = static_cast<int>(s.size());
    int size = n * (n + 1) / 2 + 1;
    std::vector<std::array<int, 26>> next(size);          // @a init
    std::vector<int> seen(size, 0);                       // @a init
    int nodes = 1;                                        // @a init
    int best = 0;                                         // @a init
    for (int i = 0; i < n; i++) {
        int node = 0;                                     // @a suffix
        int depth = 0;                                    // @a suffix
        for (int j = i; j < n; j++) {
            int c = s[j] - 'a';
            if (next[node][c] == 0) {                     // @a check
                next[node][c] = nodes++;                  // @a create
            }
            node = next[node][c];                         // @a descend
            seen[node]++;                                 // @a descend
            depth++;                                      // @a descend
            if (seen[node] >= 2 && depth > best) {        // @a best
                best = depth;                             // @a best
            }
        }
    }
    return best;                                          // @a finish
}
