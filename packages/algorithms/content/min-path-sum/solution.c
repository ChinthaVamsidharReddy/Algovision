#include <limits.h>

int min_path_sum(int *grid, int rows, int cols) {        // @a entry
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (r == 0 && c == 0) continue;              // @a start
            int up = r > 0 ? grid[(r - 1) * cols + c] : INT_MAX;     // @a best
            int left = c > 0 ? grid[r * cols + c - 1] : INT_MAX;     // @a best
            grid[r * cols + c] += up < left ? up : left;   // @a add
        }
    }
    return grid[(rows - 1) * cols + cols - 1];           // @a finish
}
