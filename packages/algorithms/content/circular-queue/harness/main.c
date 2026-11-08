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
        int capacity;
        if (scanf("%d", &capacity) != 1) return 1;
        int *res = malloc(sizeof(int) * (size_t)(n + 16));
        int count = run(values, n, capacity, res);
        int len = count;
        printf("%d", len);
        for (int i = 0; i < len; i++) printf(" %d", res[i]);
        printf("\n");
        free(res);
        free(values);
    }
    return 0;
}
