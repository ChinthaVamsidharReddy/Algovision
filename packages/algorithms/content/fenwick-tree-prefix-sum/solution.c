#include <stdlib.h>

int fenwick_prefix_sum(const int values[], int n, int index) {   // @a entry
    int *tree = calloc((size_t)n + 1, sizeof(int));      // @a init-tree
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
    free(tree);
    return total;                                        // @a finish
}
