#include <stdio.h>
#include <stdlib.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int n;
        if (scanf("%d", &n) != 1) return 1;
        int *values = malloc(sizeof(int) * (size_t)(n + 1));
        int *queue = malloc(sizeof(int) * (size_t)(n + 1));
        for (int i = 0; i < n; i++) {
            if (scanf("%d", &values[i]) != 1) return 1;
        }
        int pops;
        if (scanf("%d", &pops) != 1) return 1;
        int size = queue_run(values, n, pops, queue);
        printf("%d", size);
        for (int i = 0; i < size; i++) printf(" %d", queue[i]);
        printf("\n");
        free(values);
        free(queue);
    }
    return 0;
}
