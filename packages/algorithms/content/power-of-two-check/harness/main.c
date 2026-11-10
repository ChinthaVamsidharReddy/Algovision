#include <stdio.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int n;
        if (scanf("%d", &n) != 1) return 1;
        printf("%d\n", is_power_of_two(n));
    }
    return 0;
}
