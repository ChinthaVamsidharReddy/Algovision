#include <stdlib.h>

int rotting_minutes(int *grid, int rows, int cols) {     // @a entry
    int *queue = malloc(sizeof(int) * ((size_t)(rows * cols) + 1));
    int head = 0;
    int tail = 0;
    int fresh = 0;
    for (int i = 0; i < rows * cols; i++) {
        if (grid[i] == 2) queue[tail++] = i;             // @a init
        else if (grid[i] == 1) fresh++;                  // @a init
    }
    static const int dr[4] = {1, -1, 0, 0};
    static const int dc[4] = {0, 0, 1, -1};
    int minutes = 0;
    while (head < tail && fresh > 0) {                   // @a round
        minutes++;                                       // @a round
        for (int size = tail - head; size > 0; size--) {
            int cur = queue[head++];
            for (int k = 0; k < 4; k++) {
                int nr = cur / cols + dr[k];             // @a check
                int nc = cur % cols + dc[k];             // @a check
                if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr * cols + nc] == 1) {   // @a check
                    grid[nr * cols + nc] = 2;            // @a rot
                    fresh--;                             // @a rot
                    queue[tail++] = nr * cols + nc;      // @a rot
                }
            }
        }
    }
    free(queue);
    return fresh == 0 ? minutes : -1;                    // @a finish
}
