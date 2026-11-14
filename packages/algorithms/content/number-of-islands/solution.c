#include <stdlib.h>

static void flood(const int *grid, char *seen, int rows, int cols, int r, int c) {
    static const int dr[4] = {1, -1, 0, 0};
    static const int dc[4] = {0, 0, 1, -1};
    seen[r * cols + c] = 1;                              // @a visit
    for (int k = 0; k < 4; k++) {
        int nr = r + dr[k];                              // @a check
        int nc = c + dc[k];                              // @a check
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr * cols + nc] == 1 && !seen[nr * cols + nc]) {   // @a check
            flood(grid, seen, rows, cols, nr, nc);       // @a spread
        }
    }

}

int count_islands(const int *grid, int rows, int cols) {   // @a entry
    char *seen = calloc((size_t)(rows * cols) + 1, 1);
    int islands = 0;                                     // @a init
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r * cols + c] == 1 && !seen[r * cols + c]) {                // @a scan
                islands++;                                       // @a new-island
                flood(grid, seen, rows, cols, r, c);                         // @a new-island
            }
        }
    }
    free(seen);
    return islands;                                      // @a finish
}
