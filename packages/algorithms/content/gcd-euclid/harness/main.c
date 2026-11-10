#include <stdio.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int a;
        if (scanf("%d", &a) != 1) return 1;
        int b;
        if (scanf("%d", &b) != 1) return 1;
        printf("%d\n", gcd_euclid(a, b));
    }
    return 0;
}
