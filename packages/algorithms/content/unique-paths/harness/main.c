#include <stdio.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int rows;
        if (scanf("%d", &rows) != 1) return 1;
        int cols;
        if (scanf("%d", &cols) != 1) return 1;
        printf("%d\n", unique_paths(rows, cols));
    }
    return 0;
}
