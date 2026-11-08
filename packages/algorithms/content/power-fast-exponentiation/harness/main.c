#include <stdio.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int base;
        if (scanf("%d", &base) != 1) return 1;
        int exp;
        if (scanf("%d", &exp) != 1) return 1;
        printf("%d\n", power(base, exp));
    }
    return 0;
}
