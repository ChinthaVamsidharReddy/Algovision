#include <stdio.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int n;
        if (scanf("%d", &n) != 1) return 1;
        int res[16];
        int count = factorize(n, res);
        printf("%d", count);
        for (int i = 0; i < count; i++) printf(" %d", res[i]);
        printf("\n");
    }
    return 0;
}
