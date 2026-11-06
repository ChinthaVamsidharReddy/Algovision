#include <stdio.h>
#include <stdlib.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int n;
        if (scanf("%d", &n) != 1) return 1;
        int *values = malloc(sizeof(int) * (size_t)((n > 0 ? n : 1)));
        for (int i = 0; i < n; i++) {
            if (scanf("%d", &values[i]) != 1) return 1;
        }
        int target;
        if (scanf("%d", &target) != 1) return 1;
        int pair[2];
        int count = two_sum_sorted(values, n, target, pair);
        printf("%d", count);
        for (int i = 0; i < count; i++) printf(" %d", pair[i]);
        printf("\n");
        free(values);
    }
    return 0;
}
