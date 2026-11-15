#include <vector>

int fenwickPrefixSum(const int values[], int n, int index) {   // @a entry
    std::vector<int> tree(n + 1, 0);                     // @a init-tree
    for (int i = 1; i <= n; i++) {                       // @a build
        int j = i;                                       // @a build
        while (j <= n) {
            tree[j] += values[i - 1];                    // @a build-add
            j += j & -j;                                 // @a build-climb
        }
    }
    int total = 0;                                       // @a query
    int j = index + 1;                                   // @a query
    while (j > 0) {
        total += tree[j];                                // @a query-add
        j -= j & -j;                                     // @a query-climb
    }
    return total;                                        // @a finish
}
