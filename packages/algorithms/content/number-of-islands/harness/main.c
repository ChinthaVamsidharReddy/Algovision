#include <stdio.h>
#include <stdlib.h>
#include "solution.c"

int main(void) {
    int cases;
    if (scanf("%d", &cases) != 1) return 1;
    while (cases--) {
        int rows, cols;
        if (scanf("%d %d", &rows, &cols) != 2) return 1;
        int *grid = malloc(sizeof(int) * ((size_t)(rows * cols) + 1));
        for (int i = 0; i < rows * cols; i++) {
            if (scanf("%d", &grid[i]) != 1) return 1;
        }
        printf("%d\n", count_islands(grid, rows, cols));
        free(grid);
    }
    return 0;
}
