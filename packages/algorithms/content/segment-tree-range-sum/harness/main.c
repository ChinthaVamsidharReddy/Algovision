#include <stdio.h>
#include <stdlib.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int n;
        if (scanf("%d", &n) != 1) return 1;
        int *values = malloc(sizeof(int) * (size_t)(n > 0 ? n : 1));
        for (int i = 0; i < n; i++) {
            if (scanf("%d", &values[i]) != 1) return 1;
        }
        int left;
        if (scanf("%d", &left) != 1) return 1;
        int right;
        if (scanf("%d", &right) != 1) return 1;
        printf("%d\n", segment_tree_range_sum(values, n, left, right));
        free(values);
    }
    return 0;
}
