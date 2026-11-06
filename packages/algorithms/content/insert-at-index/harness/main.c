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
        for (int i = 0; i < n; i++) {
            if (scanf("%d", &values[i]) != 1) return 1;
        }
        int index;
        if (scanf("%d", &index) != 1) return 1;
        int value;
        if (scanf("%d", &value) != 1) return 1;
        insert_at(values, n, index, value);
        printf("%d", n + 1);
        for (int i = 0; i < n + 1; i++) printf(" %d", values[i]);
        printf("\n");
        free(values);
    }
    return 0;
}
